# Agent Sandbox Providers

**English** | [中文](README.zh-CN.md)

Connect Agent Sandbox to different sandbox backends. This repository contains installable provider plugins for the [abx CLI](https://github.com/Alibaba-Agent-Sandbox/agent-sandbox) and [Python SDK](https://github.com/Alibaba-Agent-Sandbox/python-sdk).

Alibaba Cloud Express (`alicloud-express`) is built in to the CLI. Install a plugin below to use another backend.

[Browse providers](https://registry.agent-sandbox.cn/en/providers/) · [Installation guide](docs/en/install.md) · [Provider authoring](docs/authoring.md)

## Providers

| Provider | Backend | Setup |
| --- | --- | --- |
| `opensandbox` | OpenSandbox, including its supported Docker runtime | [Guide](opensandbox/docs/README.md) |
| `e2b` | E2B sandbox service · Beta | [Guide](e2b/docs/README.md) |
| `cubesandbox` | CubeSandbox · Beta | [Guide](cubesandbox/docs/README.md) |
| `alicloud-container` | Alibaba Cloud Container edition · Beta | [Guide](alicloud-container/docs/README.md) |

Each guide describes the required account or server, credentials, supported operations and limits. OpenSandbox support depends on the deployment profile; see [supported scope](docs/acceptance.md) before choosing a backend.

## Install and configure

Install [abx](https://github.com/Alibaba-Agent-Sandbox/agent-sandbox#installation), then run in a terminal:

```bash
abx provider install Alibaba-Agent-Sandbox/awesome-providers//opensandbox
abx provider list
```

Review the installation prompt, then follow the [OpenSandbox setup guide](opensandbox/docs/README.md) to configure the server and credentials. Use `abx --provider opensandbox` for commands against that backend.

For automation, pin the source with `--ref <40-hex-commit>` and use `--yes` after reviewing the plugin. `--allow-unpinned` explicitly permits a moving source reference. See [installation](docs/en/install.md) for updates, local plugins and the Python installer.

## Use from Python

Installed providers are available through `ProviderSandbox.create(provider="opensandbox", ...)`. Use the backend's own template or image reference and credentials; provider-specific examples are in its setup guide. Node provider plugins require `abx` on PATH or `ABX_BIN` pointing to it.

The [Node.js HTTP SDK](https://github.com/Alibaba-Agent-Sandbox/nodejs-sdk) connects to application services; it does not load provider plugins or create cloud sandboxes.

## Documentation

- [How providers work](docs/en/principle.md)
- [Install, update and remove providers](docs/en/install.md)
- [Create a provider](docs/en/create.md)
- [Develop a provider](docs/en/develop.md)
- [Template operations](docs/workflows.md)

The [Registry](https://registry.agent-sandbox.cn/en/providers/) lists provider capabilities and installation options. The Python installer uses its [provider index](https://registry.agent-sandbox.cn/providers/index.json); `ABX_PROVIDER_REGISTRY` can override that source.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) for plugin structure and required checks. Provider authors using AI tools can load [SKILL.md](SKILL.md). Report plugin problems in [Issues](https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues).

## License

See each provider's license and notices in its directory for redistribution terms.
