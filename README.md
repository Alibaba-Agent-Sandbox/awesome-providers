# Awesome Providers

Installable sandbox providers for Agent Sandbox. The SDK and the CLI ship only
`alicloud-express`. Everything else is installed from this catalog.

Only the accepted Alibaba Cloud Express provider is **Stable**. OpenSandbox, E2B,
CubeSandbox and Alibaba Cloud Container are **Beta**, with formal native-backend
acceptance deferred. `official` describes maintenance, not acceptance. A scoped
OpenSandbox check does not automatically promote it. See [acceptance status](docs/acceptance.md).

目前仅已验收的阿里云极速版为**正式版**。OpenSandbox、E2B、CubeSandbox、
阿里云容器版暂为 **Beta**，其正式版真实后端验收暂缓。`official` 只表示维护来源。
局部验证不会自动升级为正式版。见[验收状态](docs/acceptance.md)。

The docs cover how a provider works, how to create one, how to develop it,
and how to install it:

- [中文](docs/README.md)
- [English](docs/en/principle.md)
- [Authoring](docs/authoring.md)
- [Skill for agents](SKILL.md)

The public index is `https://registry.agent-sandbox.cn/providers/index.json`.
`ABX_PROVIDER_REGISTRY` overrides that URL. A background check compares
installed versions and writes `~/.abx/providers/updates.json`. It does not
download. Set `ABX_PROVIDER_UPDATE_CHECK=0` to skip it.

The official site is <https://www.agent-sandbox.com>. The registry website is
<https://registry.agent-sandbox.com>. The index URL above is what the installer
fetches.

```bash
abx provider install alibaba-agent-sandbox/awesome-providers//opensandbox --allow-unpinned --yes
abx provider install alibaba-agent-sandbox/awesome-providers//e2b --allow-unpinned --yes
abx provider install alibaba-agent-sandbox/awesome-providers//cubesandbox --allow-unpinned --yes
abx provider install alibaba-agent-sandbox/awesome-providers//alicloud-container --allow-unpinned --yes
```

The CLI installs from the git tree. `--allow-unpinned` is needed without a terminal because `main` moves; add `--ref <40-hex-commit>` to pin. `registry:<id>` is a Python installer form (`python -m agent_sandbox.providers install registry:<id> --yes`) and needs the index above, which is not published yet; the `abx` CLI does not implement `registry:`.

Each directory is one provider: `abx-provider.toml`, the plugin code, and
`docs/README.md`. All four are `runtime.kind = "node"`. `opensandbox` exports `create(kit)` and runs its
EPP/1 methods in the host process (`kit.epp.infra`); `node provider.mjs` still serves EPP/1
over stdio. `e2b`, `cubesandbox` and `alicloud-container` are
`runtime.kind = "node"` (`provider.mjs`, an ES module the host loads). The
providers are written once in Node.js. The CLI runs them directly and every SDK
reaches them through the local engine (`abx provider engine serve`), so all four
work from `abx --provider <id>` and from `Sandbox.create(provider="<id>")`.

| Directory | Docs |
|---|---|
| `opensandbox/` | [docs/README.md](opensandbox/docs/README.md) |
| `cubesandbox/` | [docs/README.md](cubesandbox/docs/README.md) |
| `e2b/` | [docs/README.md](e2b/docs/README.md) |
| `alicloud-container/` | [docs/README.md](alicloud-container/docs/README.md) |

Provider create examples are owned by each plugin in `catalog.json`; see [catalog metadata](docs/catalog-metadata.md) ([中文](docs/catalog-metadata.zh-CN.md)). These patch versions do not activate pending image factories.

## Current API / 当前接口

Development changes remove retired project compatibility paths. Provider project preparation uses `templates.build`; the shared feature list no longer advertises the standalone image factory.
开发变更直接删除旧项目兼容路径。提供方项目准备使用 `templates.build`，共享能力表移除独立镜像工厂。
