---
name: awesome-providers
description: Write or install an Agent Sandbox provider from the awesome-providers catalog. Use when the task is abx-provider.toml, a provider install, a rest, exec or node provider, or E8004. Do not use this to call a sandbox that already exists; that is agent-sandbox-sdk.
---

# Awesome Providers

The SDK and the CLI ship only `alicloud-express`. This catalog holds the other providers. Read `docs/zh/principle.md` (or `docs/en/principle.md`) before editing one.

## Install an official provider

```bash
abx provider install alibaba-agent-sandbox/awesome-providers//opensandbox --allow-unpinned --yes
abx provider install alibaba-agent-sandbox/awesome-providers//cubesandbox --allow-unpinned --yes
abx provider install alibaba-agent-sandbox/awesome-providers//e2b --allow-unpinned --yes
abx provider install alibaba-agent-sandbox/awesome-providers//alicloud-container --allow-unpinned --yes
```

The CLI installs from the git tree; add `--ref <40-hex-commit>` to pin instead of `--allow-unpinned`. `registry:<id>` exists only in the Python installer (`python -m agent_sandbox.providers install registry:<id> --yes`) and needs the index below, which is not live yet; `abx` has no `registry:` form.

Index: `https://registry.agent-sandbox.cn/providers/index.json`. Override with `ABX_PROVIDER_REGISTRY` (URL or a local `index.json` path). A background check writes `~/.abx/providers/updates.json`. It does not install. `ABX_PROVIDER_UPDATE_CHECK=0` skips it. The registry website is https://registry.agent-sandbox.com. The official site is https://www.agent-sandbox.com.

All four providers are `node` (an ES module the host loads; `opensandbox` runs its EPP methods in process through `kit.epp.infra`). Both run from the CLI (`abx --provider e2b create`) and from every SDK (`Sandbox.create(provider="e2b")`); SDKs reach the plugin through the local engine, `abx provider engine serve`, which needs `abx` on `PATH` or `ABX_BIN`.

## Write a new provider

New id, new directory, one row in `index.json`. Do not reuse `alicloud-express`, `opensandbox`, `cubesandbox`, `e2b`, or `alicloud-container`.

| Kind | Write | Hosts |
|---|---|---|
| `rest` | `abx-provider.toml` only, protocol `e2b-rest/1` | SDK and CLI |
| `exec` | manifest plus an EPP/1 process, protocol `epp/1` | SDK and CLI |
| `node` | `provider.mjs` with `export default create(kit)`, protocol `node/1` | SDK and CLI |

`[features] supported` is only the 18 ids in `docs/en/create.md`. Undeclared calls raise `E8004` before I/O. Leave `[core] inherit` empty. Do not read `ABX_SANDBOX_API_KEY`.

```bash
abx provider install ./my-cloud --link --yes
abx provider doctor my-cloud
abx provider test my-cloud
```

Without a real backend, say which variable is missing. Do not borrow another provider's key.

Each provider directory has `docs/README.md`. Update that file when you change paths, features, or what has actually been run.
