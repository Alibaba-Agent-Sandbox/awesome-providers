# Awesome Providers 文档

SDK 和 CLI 只内置 `alicloud-express`。本目录是其余提供方，也是写一个新提供方的说明。

给人看的网站：官网 <https://www.agent-sandbox.com>，提供方注册站 <https://registry.agent-sandbox.com>。安装器拉取的索引仍是 `https://registry.agent-sandbox.cn/providers/index.json`。

中文：

- [工作原理](zh/principle.md)：谁内置、谁安装后加载、一次 `Sandbox.create` 怎么走到后端、密钥为什么不会串、更新检查写到哪里
- [创建](zh/create.md)：目录、清单、id、18 个能力、`rest` / `exec` / `node` 三种入口
- [开发](zh/develop.md)：链接安装、`doctor`、契约测试、没有后端时怎么写结论
- [安装](zh/install.md)：`registry:<id>`、目录、Git、回执、`updates.json`
- [目录与审查](zh/catalog.md)：四个官方提供方，以及对照上游 SDK 之后改过的行为

English:

- [How a provider works](en/principle.md)
- [Create](en/create.md)
- [Develop](en/develop.md)
- [Install](en/install.md)
- [Catalog and review](en/catalog.md)

给代理的短说明是仓库根上的 [SKILL.md](../SKILL.md)。CLI 文档里指向的贡献者指南是 [authoring.md](authoring.md)。

每个提供方自己的说明：

| 目录 | 文档 |
|---|---|
| `opensandbox/` | [docs/README.md](../opensandbox/docs/README.md) |
| `cubesandbox/` | [docs/README.md](../cubesandbox/docs/README.md) |
| `e2b/` | [docs/README.md](../e2b/docs/README.md) |
| `alicloud-container/` | [docs/README.md](../alicloud-container/docs/README.md) |
