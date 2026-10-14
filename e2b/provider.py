"""E2B cloud sandboxes as a catalog provider. It is not compiled into the SDK.

The id ``e2b`` is an official catalog id and installs with ``registry:e2b``.
It reuses the shared E2B-shaped protocol clients and gates methods the feature
set does not declare. ``ABX_SANDBOX_API_KEY`` is the Alibaba Cloud Express
key. ``E2B_API_KEY`` is a legacy name this product does not read.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from agent_sandbox.models.errors import InvalidAPIKeyError
from agent_sandbox.protocol.code_interpreter import CodeInterpreterProtocol
from agent_sandbox.protocol.filesystem import FilesystemProtocol
from agent_sandbox.protocol.process import ProcessProtocol
from agent_sandbox.protocol.sandbox import SandboxProtocol
from agent_sandbox.providers.base import ConfigField, Provider, ProviderInfra
from agent_sandbox.providers.e2b_shape import ResumeConnect, pick_option
from agent_sandbox.providers.feature_gate import (
    CODE_RULES,
    FILESYSTEM_RULES,
    PROCESS_RULES,
    SANDBOX_RULES,
    gate_protocol,
)
from agent_sandbox.providers.rest_provider import HeaderKeyAuth

if TYPE_CHECKING:
    from agent_sandbox.transport.config import TransportConfig

E2B_ID = "e2b"

# The current E2B SDK defaults are api.{domain} and domain e2b.app
# (connection_config.py). e2b.dev still resolves for older accounts when set
# explicitly. The data-plane host is https://{port}-{id}.{domain}.
_DEFAULT_BASE_URL = "https://api.e2b.app"
_DEFAULT_DOMAIN = "e2b.app"
_API_KEY_HEADER = "X-API-Key"

_ENV_BASE_URL = "ABX_E2B_BASE_URL"
_ENV_DOMAIN = "ABX_E2B_DOMAIN"
_ENV_API_KEY = "ABX_E2B_API_KEY"

_FEATURES = (
    "sandbox.lifecycle",
    "sandbox.timeout",
    "sandbox.pause",
    "exec.run",
    "exec.stream",
    "process.manage",
    "files.rw",
    "files.watch",
    "code.interpret",
    "ports.url",
)


def resolve_endpoint(config: TransportConfig) -> tuple[str, str, str]:
    """``(base_url, api_key, domain)`` from provider options, then ``ABX_E2B_*``.

    Does not read ``ABX_SANDBOX_API_KEY`` or ``E2B_API_KEY``. ``api_url`` is
    ignored unless it was copied into ``provider_options["base_url"]``.
    """
    opts = dict(config.provider_options)
    base = pick_option(opts, "base_url", _ENV_BASE_URL, _DEFAULT_BASE_URL).rstrip("/")
    key = pick_option(opts, "api_key", _ENV_API_KEY, "")
    domain = pick_option(opts, "domain", _ENV_DOMAIN, _DEFAULT_DOMAIN)
    return base, key, domain


class E2BProvider(Provider):
    """Catalog adapter. ``Sandbox.create(provider='e2b')`` dials the E2B API."""

    id = E2B_ID
    display_name = "E2B"
    display_name_zh = "E2B"
    kind = "python"
    features = frozenset(_FEATURES)
    extensions = ()
    inherit = frozenset()

    def __init__(self) -> None:
        from agent_sandbox._version import __version__

        self.version = __version__
        self.config_fields = (
            ConfigField(
                key="base_url",
                type="url",
                default=_DEFAULT_BASE_URL,
                description="E2B platform API origin. Requests go to /sandboxes.",
                description_zh="E2B 平台 API 源站。请求发到 /sandboxes。",
            ),
            ConfigField(
                key="domain",
                default=_DEFAULT_DOMAIN,
                description="Domain suffix for https://{port}-{sandboxID}.{domain}.",
                description_zh="envd 主机名 https://{port}-{sandboxID}.{domain} 的域名后缀。",
            ),
            ConfigField(
                key="api_key",
                secret=True,
                credential=True,
                description="Value of the X-API-Key header. Set ABX_E2B_API_KEY.",
                description_zh="X-API-Key 请求头。设置 ABX_E2B_API_KEY。",
            ),
        )

    async def build_infra(self, config: TransportConfig) -> ProviderInfra:
        from agent_sandbox.transport.http import HttpClient

        self.validate_config(config)
        base, key, domain = resolve_endpoint(config)
        if not key:
            raise InvalidAPIKeyError(
                "Provider 'e2b' has no API key.",
                suggestion=f"Set {_ENV_API_KEY}.",
            )
        copied = config.model_copy(
            update={
                "provider": E2B_ID,
                "sandbox_base_url": base,
                "sandbox_domain": domain,
            }
        )
        auth = HeaderKeyAuth(key, scheme="header", header=_API_KEY_HEADER)
        http = HttpClient(copied, auth)
        supported = self.features

        def gate(protocol: object, rules: dict[str, tuple[str, ...]]) -> object:
            return gate_protocol(protocol, self.id, rules, supported)

        return ProviderInfra(
            config=copied,
            auth=auth,
            http_client=http,
            sandbox_protocol=gate(
                ResumeConnect(
                    SandboxProtocol(http, unknown_if_absent=True),
                    ("/v2/sandboxes/{id}/connect", "/sandboxes/{id}/connect"),
                ),
                SANDBOX_RULES,
            ),
            process_protocol=gate(ProcessProtocol(http), PROCESS_RULES),
            filesystem_protocol=gate(FilesystemProtocol(http), FILESYSTEM_RULES),
            code_interpreter_protocol=gate(CodeInterpreterProtocol(http), CODE_RULES),
        )


_provider: E2BProvider | None = None


def e2b_provider() -> E2BProvider:
    global _provider
    if _provider is None:
        _provider = E2BProvider()
    return _provider


def load() -> E2BProvider:
    return e2b_provider()
