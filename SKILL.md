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

The CLI installs from the git tree; add `--ref <40-hex-commit>` to pin instead of `--allow-unpinned`. `registry:<id>` exists only in the Python installer (`python -m agent_sandbox.providers install registry:<id> --yes`) and uses the published index below; `abx` has no `registry:` form.

Index: `https://registry.agent-sandbox.cn/providers/index.json`. Override with `ABX_PROVIDER_REGISTRY` (URL or a local `index.json` path). A background check writes `~/.abx/providers/updates.json`. It does not install. `ABX_PROVIDER_UPDATE_CHECK=0` skips it. The registry website is https://registry.agent-sandbox.com. The official site is https://www.agent-sandbox.com.

All four providers are `node` (an ES module the host loads; `opensandbox` runs its EPP methods in process through `kit.epp.infra`). Both run from the CLI (`abx --provider e2b create`) and from every SDK (`Sandbox.create(provider="e2b")`); SDKs reach the plugin through the local engine, `abx provider engine serve`, which needs `abx` on `PATH` or `ABX_BIN`.

## Write a new provider

New id, new directory, one row in `index.json`. Do not reuse `alicloud-express`, `opensandbox`, `cubesandbox`, `e2b`, or `alicloud-container`.

| Kind | Write | Hosts |
|---|---|---|
| `rest` | `abx-provider.toml` only, protocol `e2b-rest/1` | SDK and CLI |
| `exec` | manifest plus an EPP/1 process, protocol `epp/1` | SDK and CLI |
| `node` | `provider.mjs` with `export default create(kit)`, protocol `node/1` | SDK and CLI |

`[features] supported` is only the current non-interpreter feature ids in `docs/en/create.md`. Undeclared calls raise `E8004` before I/O. Leave `[core] inherit` empty. Do not read `ABX_SANDBOX_API_KEY`.

```bash
abx provider install ./my-cloud --link --yes
abx provider doctor my-cloud
abx provider test my-cloud
```

Without a real backend, say which variable is missing. Do not borrow another provider's key.

Each provider directory has `docs/README.md`. Update that file when you change paths, features, or what has actually been run.

## Prepare project sources

Use a CLI build containing `template launch` (the original npm 0.4.0 release predates it):

```sh
abx --provider <id> template launch owner/repository//template-path --yes
```

Configure backend credentials and build prerequisites once; read that provider’s `docs/README.md`. The manager owns `prepareProject(directory, options)` under `templates.build` and returns `{reference,status:"ready"}` with optional service/readiness commands and creation metadata. Pass its exact native reference to the same provider. Use generic `kit.project.stage`, `buildImage` and `runTool` primitives; keep SDK/API mapping, authentication, polling and cluster policy in the adapter. Do not add vendor-ID switches to the host or Registry.

E2B uses its independent key and official SDK parser; Cube builds/pushes then registers natively; OpenSandbox uses the built image directly; container edition clones a configured base SandboxSet in the API-key namespace. Only exact operations of the selected workflow block that path; an application does not inherit a unified interpreter requirement. Successful build artifacts remain for reuse; do not silently delete existing resources. All catalog providers remain Beta; scoped Docker or loopback checks do not establish full native acceptance.

Use `abx provider update <id> --check` to inspect a recorded Git source, then the documented consent/pin options to update. Pinned installs stay pinned. `abx provider update alicloud-express --check` reports the bundled upgrade path; built-in code is updated with the CLI, not a separately installed plugin.

See [exact workflow operations](docs/workflows.md) ([中文](docs/workflows.zh-CN.md)).
