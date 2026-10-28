# Agent Sandbox 提供方

**中文** | [English](README.md)

让 Agent Sandbox 连接不同的沙箱后端。本仓库提供供 [abx CLI](https://github.com/Alibaba-Agent-Sandbox/agent-sandbox) 和 [Python SDK](https://github.com/Alibaba-Agent-Sandbox/python-sdk)安装使用的提供方插件。

CLI 已内置阿里云极速版（`alicloud-express`），使用其他后端时安装下方对应插件。

[浏览提供方](https://registry.agent-sandbox.cn/providers/) · [安装指南](docs/zh/install.md) · [编写提供方](docs/authoring.zh-CN.md)

## 提供方

| 提供方 | 后端 | 配置说明 |
| --- | --- | --- |
| `opensandbox` | OpenSandbox，含支持的 Docker 运行环境 | [指南](opensandbox/docs/README.md) |
| `e2b` | E2B 沙箱服务 · Beta | [指南](e2b/docs/README.md) |
| `cubesandbox` | CubeSandbox · Beta | [指南](cubesandbox/docs/README.md) |
| `alicloud-container` | 阿里云容器版 · Beta | [指南](alicloud-container/docs/README.md) |

各指南说明所需账号或服务、凭据、支持的操作和限制。OpenSandbox 的支持范围取决于部署配置，选择后端前请阅读[支持范围](docs/acceptance.md)。

## 安装与配置

先[安装 abx](https://github.com/Alibaba-Agent-Sandbox/agent-sandbox#installation)，再在终端中运行：

```bash
abx provider install Alibaba-Agent-Sandbox/awesome-providers//opensandbox
abx provider list
```

阅读并确认安装提示，然后按 [OpenSandbox 配置指南](opensandbox/docs/README.md)设置服务地址和凭据。通过 `abx --provider opensandbox` 对该后端执行操作。

自动化安装时，用 `--ref <40-hex-commit>` 固定源码，在审查插件后添加 `--yes`。`--allow-unpinned` 表示明确允许使用可变的源码引用。更新、本地插件和 Python 安装器用法见[安装指南](docs/zh/install.md)。

## 从 Python 使用

安装后的提供方可通过 `ProviderSandbox.create(provider="opensandbox", ...)` 调用。使用该后端自己的模板或镜像引用及凭据，具体示例见对应配置指南。Node 提供方插件需要 PATH 中有 `abx`，或通过 `ABX_BIN` 指定其位置。

[Node.js HTTP SDK](https://github.com/Alibaba-Agent-Sandbox/nodejs-sdk)用于连接应用服务，不负责加载提供方插件或创建云沙箱。

## 文档

- [提供方工作原理](docs/zh/principle.md)
- [安装、更新与卸载](docs/zh/install.md)
- [创建提供方](docs/zh/create.md)
- [开发提供方](docs/zh/develop.md)
- [模板操作](docs/workflows.zh-CN.md)

[Registry](https://registry.agent-sandbox.cn/providers/)提供能力和安装方式对照。Python 安装器使用其[提供方索引](https://registry.agent-sandbox.cn/providers/index.json)，可通过 `ABX_PROVIDER_REGISTRY` 覆盖来源。

## 参与贡献

插件结构和检查要求见[贡献指南](CONTRIBUTING.md)。使用 AI 工具编写插件时可加载 [SKILL.md](SKILL.md)。插件问题请提交到 [Issues](https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues)。

## 许可证

各插件的分发条款见对应目录中的许可证和署名文件。
