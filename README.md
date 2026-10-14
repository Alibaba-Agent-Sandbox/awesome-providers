# Awesome Providers

Installable sandbox providers for Agent Sandbox. The SDK and the CLI ship only
`alicloud-express`. Everything else is installed from this catalog.

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
