"""Alibaba Cloud Agent Sandbox container edition (``alicloud-container``).

This is not Express (``alicloud-express``). Container edition is the
OpenKruise Agents sandbox-manager on ACS or ACK. It speaks the E2B HTTP
shape.

* Native: API ``https://api.{domain}``, envd ``https://{port}-{id}.{domain}``.
* Private: API ``https://{domain}/kruise/api``, envd ``https://{domain}/kruise/{id}``.

Auth is the sandbox-manager API key in header ``X-API-Key``. The Express key
``ABX_SANDBOX_API_KEY`` is not read.

Documented support: create, list, info, kill, connect, timeout, commands,
files read/write, and ``run_code`` when the image has a code interpreter.
Presigned file URLs, template build, volume mounts, and logs/metrics are not
part of that surface and raise ``E8004``.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from agent_sandbox.models.errors import InvalidAPIKeyError, ProviderConfigError
from agent_sandbox.protocol.filesystem import FilesystemProtocol
from agent_sandbox.protocol.process import ProcessProtocol
from agent_sandbox.protocol.sandbox import SandboxProtocol
from agent_sandbox.providers.base import FEATURES, ConfigField, Provider, ProviderInfra
from agent_sandbox.providers.e2b_shape import ResumeConnect, _execution, pick_option
from agent_sandbox.providers.feature_gate import (
    CODE_RULES,
    FILESYSTEM_RULES,
    PROCESS_RULES,
    SANDBOX_RULES,
    gate_protocol,
)
from agent_sandbox.providers.rest_provider import HeaderKeyAuth

if TYPE_CHECKING:
    from agent_sandbox.models.sandbox import SandboxConfig, SandboxInfo
    from agent_sandbox.transport.config import TransportConfig

CONTAINER_ID = "alicloud-container"
_API_KEY_HEADER = "X-API-Key"

_ENV_BASE = "ABX_ALICLOUD_CONTAINER_BASE_URL"
_ENV_DOMAIN = "ABX_ALICLOUD_CONTAINER_DOMAIN"
_ENV_KEY = "ABX_ALICLOUD_CONTAINER_API_KEY"
_ENV_PROTOCOL = "ABX_ALICLOUD_CONTAINER_PROTOCOL"

_SUPPORTED = (
    "sandbox.lifecycle",
    "sandbox.timeout",
    "exec.run",
    "exec.stream",
    "process.manage",
    "files.rw",
    "code.interpret",
    "ports.url",
    "sandbox.pause",
)


def resolve_endpoint(config: TransportConfig) -> tuple[str, str, str, str]:
    """``(base_url, domain, api_key, protocol)``.

    ``protocol`` is ``native`` or ``private``. Does not read
    ``ABX_SANDBOX_API_KEY``.
    """
    opts = dict(config.provider_options)
    protocol = (pick_option(opts, "protocol", _ENV_PROTOCOL) or "native").lower()
    if protocol not in {"native", "private"}:
        raise ProviderConfigError(
            f"Provider '{CONTAINER_ID}' protocol must be native or private, got {protocol!r}."
        )
    domain = pick_option(opts, "domain", _ENV_DOMAIN)
    key = pick_option(opts, "api_key", _ENV_KEY)
    base = pick_option(opts, "base_url", _ENV_BASE).rstrip("/")
    if not domain and not base:
        raise ProviderConfigError(
            f"Provider '{CONTAINER_ID}' needs a domain or a base URL.",
            suggestion=f"Set {_ENV_DOMAIN} to the sandbox-manager domain.",
        )
    if not base:
        base = (
            f"https://{domain}/kruise/api" if protocol == "private" else f"https://api.{domain}"
        )
    if not domain:
        host = base.split("://", 1)[-1].split("/", 1)[0]
        domain = host[4:] if host.startswith("api.") else host
    if not key:
        raise InvalidAPIKeyError(
            f"Provider '{CONTAINER_ID}' has no API key.",
            suggestion=f"Set {_ENV_KEY}.",
        )
    return base, domain, key, protocol


_ENVD_PORT = 49983
_CODE_PORT = 49999


def execute_url(envd_url: str) -> str:
    """envd base -> Jupyter ``/execute`` on port 49999."""
    from urllib.parse import urlsplit, urlunsplit

    parts = urlsplit(envd_url)
    host = parts.hostname or ""
    prefix = f"{_ENVD_PORT}-"
    if host.startswith(prefix):
        host = f"{_CODE_PORT}-{host[len(prefix):]}"
        port = parts.port
        netloc = host if port in (None, 80, 443) else f"{host}:{port}"
        return urlunsplit((parts.scheme or "https", netloc, "/execute", "", ""))
    path = parts.path.rstrip("/")
    if path.endswith(f"/{_ENVD_PORT}"):
        path = path[: -len(f"/{_ENVD_PORT}")] + f"/{_CODE_PORT}/execute"
    else:
        path = path + "/execute"
    return urlunsplit((parts.scheme or "https", parts.netloc, path, "", ""))


class _ContainerControl:
    """v2 list, private envd ``/kruise/{id}/49983``, and Jupyter execute."""

    def __init__(self, inner: Any, origin: str | None) -> None:
        self._inner = inner
        self._origin = origin.rstrip("/") if origin else None
        self.has_port_url = origin is not None

    def _fill(self, info: SandboxInfo) -> SandboxInfo:
        if self._origin and info.sandbox_id and not info.envd_url:
            info.envd_url = f"{self._origin}/kruise/{info.sandbox_id}/{_ENVD_PORT}"
        return info

    async def create(
        self, config: SandboxConfig, *, request_timeout: float | None = None
    ) -> SandboxInfo:
        return self._fill(await self._inner.create(config, request_timeout=request_timeout))

    async def connect(self, sandbox_id: str) -> SandboxInfo:
        return self._fill(await self._inner.connect(sandbox_id))

    async def get_info(self, sandbox_id: str) -> SandboxInfo:
        return self._fill(await self._inner.get_info(sandbox_id))

    async def list(
        self, *, status: Any = None, limit: int = 100, offset: int = 0
    ) -> list[SandboxInfo]:
        params: dict[str, Any] = {"limit": limit}
        if status is not None:
            params["state"] = status.value if hasattr(status, "value") else str(status)
        if offset:
            params["offset"] = offset
        response = await self._inner._http.platform_request("GET", "/v2/sandboxes", params=params)
        data = response.json()
        items = data if isinstance(data, list) else data.get("sandboxes", data.get("data", []))
        return [self._fill(self._inner._info(item)) for item in items]

    async def port_url(self, sandbox_id: str, port: int) -> tuple[str, dict[str, str]]:
        if not self._origin:
            raise AttributeError("port_url")
        return f"{self._origin}/kruise/{sandbox_id}/{port}", {}

    def __getattr__(self, name: str) -> Any:
        return getattr(self._inner, name)


class _ContainerCode:
    """``POST /execute`` on port 49999. Not the envd CodeInterpreter RPC."""

    def __init__(self, http: Any) -> None:
        self._http = http

    async def run_code(
        self,
        sandbox_id: str,
        envd_url: str,
        envd_token: Any,
        **kwargs: Any,
    ) -> dict[str, Any]:
        del sandbox_id
        import json

        url = execute_url(envd_url)
        slash = url.find("/execute")
        origin, path = url[:slash], url[slash:]
        body = {
            "code": kwargs.get("code", ""),
            "language": kwargs.get("language") or "python",
        }
        if kwargs.get("envs"):
            body["env_vars"] = kwargs["envs"]
        response = await self._http.envd_http_request(
            origin,
            "POST",
            path,
            envd_token=envd_token,
            headers={"Content-Type": "application/json", "E2b-Sandbox-Port": str(_CODE_PORT)},
            content=json.dumps(body).encode(),
        )
        return _execution(response.text)

    def __getattr__(self, name: str) -> Any:
        raise AttributeError(name)


class AlicloudContainerProvider(Provider):
    """Catalog adapter. ``Sandbox.create(provider='alicloud-container')``."""

    id = CONTAINER_ID
    display_name = "Alibaba Cloud Agent Sandbox Container Edition"
    display_name_zh = "阿里云智能体沙箱容器版"
    kind = "python"
    features = frozenset(name for name in FEATURES if name in _SUPPORTED)
    extensions = ()
    inherit = frozenset()

    def __init__(self) -> None:
        from agent_sandbox._version import __version__

        self.version = __version__
        self.config_fields = (
            ConfigField(
                key="domain",
                description="sandbox-manager domain. Native API is https://api.{domain}.",
                description_zh="sandbox-manager 域名。原生协议的 API 是 https://api.{domain}。",
                env=(_ENV_DOMAIN,),
            ),
            ConfigField(
                key="base_url",
                type="url",
                description="Override the API origin. Private protocol is https://{domain}/kruise/api.",
                description_zh="覆盖 API 源站。私有协议是 https://{domain}/kruise/api。",
                env=(_ENV_BASE,),
            ),
            ConfigField(
                key="api_key",
                secret=True,
                credential=True,
                description="sandbox-manager API key, sent as X-API-Key.",
                description_zh="sandbox-manager 的 API Key，放在 X-API-Key。",
                env=(_ENV_KEY,),
            ),
            ConfigField(
                key="protocol",
                default="native",
                choices=("native", "private"),
                description="native uses {port}-{id}.{domain}. private uses /kruise/{id}/{port}.",
                description_zh="native 用 {port}-{id}.{domain}。private 用 /kruise/{id}/{port}。",
                env=(_ENV_PROTOCOL,),
            ),
        )

    async def build_infra(self, config: TransportConfig) -> ProviderInfra:
        from agent_sandbox.transport.http import HttpClient

        self.validate_config(config)
        base, domain, key, protocol = resolve_endpoint(config)
        copied = config.model_copy(
            update={
                "provider": CONTAINER_ID,
                "sandbox_base_url": base,
                "sandbox_domain": domain,
            }
        )
        auth = HeaderKeyAuth(key, scheme="header", header=_API_KEY_HEADER)
        http = HttpClient(copied, auth)
        supported = self.features
        origin = None
        if protocol == "private":
            if base.endswith("/kruise/api"):
                origin = base[: -len("/kruise/api")]
            else:
                origin = f"https://{domain}"
        sandbox = _ContainerControl(
            ResumeConnect(SandboxProtocol(http, unknown_if_absent=True)),
            origin,
        )

        def gate(protocol_obj: object, rules: dict[str, tuple[str, ...]]) -> object:
            return gate_protocol(protocol_obj, self.id, rules, supported)

        return ProviderInfra(
            config=copied,
            auth=auth,
            http_client=http,
            sandbox_protocol=gate(sandbox, SANDBOX_RULES),
            process_protocol=gate(ProcessProtocol(http), PROCESS_RULES),
            filesystem_protocol=gate(FilesystemProtocol(http), FILESYSTEM_RULES),
            code_interpreter_protocol=gate(_ContainerCode(http), CODE_RULES),
        )


_provider: AlicloudContainerProvider | None = None


def alicloud_container_provider() -> AlicloudContainerProvider:
    global _provider
    if _provider is None:
        _provider = AlicloudContainerProvider()
    return _provider


def load() -> AlicloudContainerProvider:
    return alicloud_container_provider()
