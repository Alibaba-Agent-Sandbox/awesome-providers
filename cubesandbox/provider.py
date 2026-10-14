"""Tencent CubeSandbox catalog provider. It is not compiled into the SDK.

CubeAPI is an E2B-shaped control plane. This adapter reuses
:class:`~agent_sandbox.protocol.sandbox.SandboxProtocol`,
:class:`~agent_sandbox.protocol.process.ProcessProtocol`,
:class:`~agent_sandbox.protocol.filesystem.FilesystemProtocol` and
:class:`~agent_sandbox.protocol.code_interpreter.CodeInterpreterProtocol`,
gated by the provider's feature set. Paths below were checked against
``openapi.yml`` and the official Python SDK
(https://github.com/TencentCloud/CubeSandbox). A path that those sources
do not use is not called from here.

The Cube SDK README names ``CUBE_API_URL`` default ``http://127.0.0.1:3000``.
That port is the default base URL. ``ABX_SANDBOX_API_KEY`` belongs to
Alibaba Cloud Express and is never read.
"""

from __future__ import annotations

import json
from typing import TYPE_CHECKING, Any

from agent_sandbox.protocol.filesystem import FilesystemProtocol
from agent_sandbox.protocol.process import ProcessProtocol
from agent_sandbox.protocol.sandbox import SandboxProtocol
from agent_sandbox.providers.base import (
    FEATURES,
    ConfigField,
    Extension,
    Provider,
    ProviderInfra,
)
from agent_sandbox.providers.e2b_shape import (
    DefaultArg,
    ResumeConnect,
    _execution,
    pick_option,
)
from agent_sandbox.providers.feature_gate import (
    CODE_RULES,
    FILESYSTEM_RULES,
    PROCESS_RULES,
    SANDBOX_RULES,
    gate_protocol,
)
from agent_sandbox.providers.rest_provider import HeaderKeyAuth


class _RootFiles(FilesystemProtocol):
    """File bytes go to envd as ``username=root``. Cube has no ``user`` account."""

    async def read(self, envd_url: str, envd_token: Any, *, path: str) -> bytes:
        return await self.download_file(envd_url, envd_token, path=path, username="root")

    async def write(
        self, envd_url: str, envd_token: Any, *, path: str, content: str | bytes
    ) -> None:
        raw = content.encode("utf-8") if isinstance(content, str) else content
        await self.upload_file(envd_url, envd_token, path=path, content=raw, username="root")

if TYPE_CHECKING:
    from agent_sandbox.transport.config import TransportConfig

CUBESANDBOX_ID = "cubesandbox"

# Cube Python SDK README: CUBE_API_URL defaults to this origin (not :8080).
# Cube Python SDK: CUBE_API_URL defaults to this origin. CUBE_SANDBOX_DOMAIN
# defaults to cube.app. localhost does not reach CubeProxy.
_DEFAULT_BASE_URL = "http://127.0.0.1:3000"
_DEFAULT_DOMAIN = "cube.app"

_ENV_BASE_URL = "ABX_CUBESANDBOX_BASE_URL"
_ENV_API_KEY = "ABX_CUBESANDBOX_API_KEY"
_ENV_DOMAIN = "ABX_CUBESANDBOX_DOMAIN"
_ENV_PROXY = "ABX_CUBESANDBOX_PROXY"
_JUPYTER_PORT = 49999

_SUPPORTED = (
    "sandbox.lifecycle",
    "sandbox.timeout",
    "sandbox.pause",
    "exec.run",
    "exec.stream",
    "files.rw",
    "files.watch",
    "code.interpret",
    "ports.url",
)

# Confirmed in openapi.yml, outside the 18 feature ids. Not called.
EXTENSIONS: tuple[Extension, ...] = (
    Extension(
        "volume.mounts",
        "Attach a Cube volume with NewSandbox.volumeMounts, or manage /volumes.",
        "用 NewSandbox.volumeMounts 挂载卷，或调用 /volumes。",
        False,
        "sandbox",
    ),
    Extension(
        "network.policy",
        "Egress policy on create (network) or PUT /sandboxes/{id}/network.",
        "创建时的 network，或 PUT /sandboxes/{id}/network 出网策略。",
        False,
        "sandbox",
    ),
    Extension(
        "distribution.scope",
        "Pin scheduling with NewSandbox.distributionScope (node id or host IP).",
        "用 NewSandbox.distributionScope 把调度限制到节点或主机 IP。",
        False,
        "sandbox",
    ),
)


def _parse_proxy(value: str) -> tuple[str, int] | None:
    text = value.strip()
    if not text:
        return None
    host, _, port = text.partition(":")
    if not host:
        return None
    return host, int(port) if port else 80


def jupyter_execute_url(envd_url: str) -> str:
    """``http://49983-{id}.{domain}`` -> ``http://49999-{id}.{domain}/execute``."""
    from urllib.parse import urlsplit, urlunsplit

    parts = urlsplit(envd_url)
    host = parts.hostname or ""
    prefix = f"{49983}-"
    if host.startswith(prefix):
        host = f"{_JUPYTER_PORT}-{host[len(prefix) :]}"
    port = parts.port
    netloc = host if port in (None, 80, 443) else f"{host}:{port}"
    return urlunsplit((parts.scheme or "http", netloc, "/execute", "", ""))


class _CubeControl:
    """Fill an http envd URL. Resume posts an empty JSON object."""

    def __init__(self, inner: Any, domain: str) -> None:
        self._inner = inner
        self._domain = domain

    def _fill(self, info: Any) -> Any:
        domain = getattr(info, "reported_domain", None) or self._domain
        if info.sandbox_id and not info.envd_url:
            from agent_sandbox.transport.config import ENVD_PORT

            info.envd_url = f"http://{ENVD_PORT}-{info.sandbox_id}.{domain}"
        return info

    async def create(self, config: Any, *, request_timeout: float | None = None) -> Any:
        return self._fill(await self._inner.create(config, request_timeout=request_timeout))

    async def connect(self, sandbox_id: str) -> Any:
        return self._fill(await self._inner.connect(sandbox_id))

    async def get_info(self, sandbox_id: str) -> Any:
        return self._fill(await self._inner.get_info(sandbox_id))

    async def resume(self, sandbox_id: str) -> None:
        http = self._inner._http
        await http.platform_request("POST", f"/sandboxes/{sandbox_id}/resume", json={})

    def __getattr__(self, name: str) -> Any:
        return getattr(self._inner, name)


class _CubeCode:
    """``POST /execute`` on the Jupyter host, not the envd CodeInterpreter RPC."""

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
        url = jupyter_execute_url(envd_url)
        origin, path = url[: -len("/execute")], "/execute"
        body = {
            "code": kwargs.get("code", ""),
            "language": kwargs.get("language") or "python",
        }
        envs = kwargs.get("envs")
        if envs:
            body["env_vars"] = envs
        response = await self._http.envd_http_request(
            origin,
            "POST",
            path,
            envd_token=envd_token,
            headers={
                "Content-Type": "application/json",
                "E2b-Sandbox-Port": str(_JUPYTER_PORT),
            },
            content=json.dumps(body).encode(),
        )
        return _execution(response.text)

    def __getattr__(self, name: str) -> Any:
        raise AttributeError(name)


class _NoAuth:
    """Local CubeAPI often has no auth callback. Send no credential header."""

    async def get_headers(self) -> dict[str, str]:
        return {}

    async def refresh(self) -> None:
        return None


def resolve_endpoint(config: TransportConfig) -> tuple[str, str, str]:
    """``(base_url, api_key, domain)``. Never reads ``ABX_SANDBOX_API_KEY``."""
    opts = dict(config.provider_options)
    base = pick_option(opts, "base_url", _ENV_BASE_URL, _DEFAULT_BASE_URL).rstrip("/")
    key = pick_option(opts, "api_key", _ENV_API_KEY, "")
    domain = pick_option(opts, "domain", _ENV_DOMAIN, _DEFAULT_DOMAIN)
    return base, key, domain


class CubeSandboxProvider(Provider):
    """Catalog adapter. ``Sandbox.create(provider='cubesandbox')`` dials CubeAPI."""

    id = CUBESANDBOX_ID
    display_name = "CubeSandbox"
    display_name_zh = "CubeSandbox"
    kind = "python"
    features = frozenset(name for name in FEATURES if name in _SUPPORTED)
    extensions = EXTENSIONS
    inherit = frozenset()
    envd_allow_missing = True
    envd_basic_user = "root"

    def __init__(self) -> None:
        from agent_sandbox._version import __version__

        self.version = __version__
        self.config_fields = (
            ConfigField(
                key="base_url",
                type="url",
                default=_DEFAULT_BASE_URL,
                description="CubeAPI origin, without a path prefix. SDK default port is 3000.",
                description_zh="CubeAPI 源站，不带路径前缀。SDK 默认端口是 3000。",
                env=(_ENV_BASE_URL,),
            ),
            ConfigField(
                key="api_key",
                secret=True,
                credential=True,
                description="Optional X-API-Key. Omitted when unset. Not ABX_SANDBOX_API_KEY.",
                description_zh="可选的 X-API-Key。未设置则不发送。不是 ABX_SANDBOX_API_KEY。",
                env=(_ENV_API_KEY,),
            ),
            ConfigField(
                key="domain",
                default=_DEFAULT_DOMAIN,
                description="Suffix for {port}-{sandboxID}.{domain}. Default cube.app.",
                description_zh="端口主机名后缀。默认 cube.app。",
                env=(_ENV_DOMAIN,),
            ),
            ConfigField(
                key="proxy",
                description="CubeProxy host:port. TCP goes there; Host stays the virtual name.",
                description_zh="CubeProxy 的 host:port。TCP 打到这里，Host 仍是虚拟主机名。",
                env=(_ENV_PROXY,),
            ),
        )

    async def build_infra(self, config: TransportConfig) -> ProviderInfra:
        from agent_sandbox.transport.http import HttpClient

        self.validate_config(config)
        base, key, domain = resolve_endpoint(config)
        copied = config.model_copy(update={"sandbox_base_url": base, "sandbox_domain": domain})
        auth: HeaderKeyAuth | _NoAuth = (
            HeaderKeyAuth(key, "header", "X-API-Key") if key else _NoAuth()
        )
        proxy = _parse_proxy(pick_option(dict(config.provider_options), "proxy", _ENV_PROXY, ""))
        http = HttpClient(
            copied,
            auth,
            envelope_connect=True,
            envd_dial=proxy,
        )
        supported = self.features

        def gate(protocol: object, rules: dict[str, tuple[str, ...]]) -> object:
            return gate_protocol(protocol, self.id, rules, supported)

        control = _CubeControl(
            ResumeConnect(SandboxProtocol(http, unknown_if_absent=True)),
            domain,
        )
        # Cube envd rejects process and file calls that omit the user.
        # DefaultArg cannot see download_file/upload_file, which default to username=user.
        process = DefaultArg(ProcessProtocol(http), "user", "root")
        files = DefaultArg(_RootFiles(http), "username", "root")
        return ProviderInfra(
            config=copied,
            auth=auth,
            http_client=http,
            sandbox_protocol=gate(control, SANDBOX_RULES),
            process_protocol=gate(process, PROCESS_RULES),
            filesystem_protocol=gate(files, FILESYSTEM_RULES),
            code_interpreter_protocol=gate(_CubeCode(http), CODE_RULES),
        )


_provider: CubeSandboxProvider | None = None


def cubesandbox_provider() -> CubeSandboxProvider:
    global _provider
    if _provider is None:
        _provider = CubeSandboxProvider()
    return _provider


def load() -> CubeSandboxProvider:
    return cubesandbox_provider()
