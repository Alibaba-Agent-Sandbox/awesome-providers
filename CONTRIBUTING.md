# Contributing

[中文](#中文)

Providers in this repository are installable backends for the Agent Sandbox CLI and Python SDK. One directory is one provider. The SDK and the CLI do not vendor these plugins.

1. Read [docs/authoring.md](docs/authoring.md). It explains how `abx create` reaches a plugin and which methods you must implement.
2. If you are using an AI coding tool, load [SKILL.md](SKILL.md) first (`npx skills add alibaba-agent-sandbox/awesome-providers --skill agent-sandbox-provider -y`).
3. Add a directory whose name is the provider id, plus one entry in `awesome-providers.yaml`.
4. Follow [docs/e2e.md](docs/e2e.md). T0 must pass. The README must say what works, what is partial, and what returns E8004.
5. Open a pull request. Do not commit API keys, cloud credentials, or a populated `~/.abx`.

## 中文

本仓库里的 provider 是 Agent Sandbox CLI 和 Python SDK 的可安装后端。一个目录就是一个 provider。SDK 和 CLI 不内置这些插件。

1. 阅读 [docs/authoring.zh-CN.md](docs/authoring.zh-CN.md)。里面说明了 `abx create` 如何调用到插件，以及必须实现哪些方法。
2. 使用 AI 编码工具时，先加载 [SKILL.md](SKILL.md)（`npx skills add alibaba-agent-sandbox/awesome-providers --skill agent-sandbox-provider -y`）。
3. 新增一个与 provider id 同名的目录，并在 `awesome-providers.yaml` 增加一条。
4. 按 [docs/e2e.zh-CN.md](docs/e2e.zh-CN.md) 测试。T0 必须通过。README 必须写明能用、部分可用、以及返回 E8004 的能力。
5. 提交 pull request。不要提交 API key、云凭证，或填好的 `~/.abx`。
