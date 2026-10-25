---
name: awesome-providers
description: Install or contribute providers in the awesome-providers catalog, including catalog metadata, provider-specific configuration and acceptance evidence. For implementing the shared plugin protocol, use agent-sandbox-provider from the Python SDK repository. For invoking existing sandbox applications, use agent-sandbox-sdk.
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

All four providers are `node` (an ES module the host loads; `opensandbox` runs its EPP methods in process through `kit.epp.infra`). All four run from the CLI (`abx --provider e2b create`) and from the Python Provider API (`ProviderSandbox.create(provider="e2b")`); Python reaches the plugin through the local engine, `abx provider engine serve`, which needs `abx` on `PATH` or `ABX_BIN`.

Python hosts `exec` plugins directly as processes and `rest` plugins directly over HTTP; these do not need the Node engine. Installation reads static metadata before consent; after consent, default verification may load the plugin for its handshake. `--yes` does not skip verification.

The independent Node.js SDK currently exposes `ServerClient` for in-sandbox HTTP services; it does not load providers. Other languages need an implemented engine bridge. For shared protocol development, read [agent-sandbox-provider](https://github.com/Alibaba-Agent-Sandbox/python-sdk/blob/main/agent-sandbox-provider/SKILL.md).

## Write a new provider

New id, new directory, one row in the source catalog `awesome-providers.yaml`. Keep the source `index.json` consistent: the Registry currently reads it to select provider directories and generate its public download index and archives; it also supports local Python installer tests. Do not reuse `alicloud-express`, `opensandbox`, `cubesandbox`, `e2b`, or `alicloud-container`.

| Kind | Write | Hosts |
|---|---|---|
| `rest` | `abx-provider.toml` only, protocol `e2b-rest/1` | CLI and Python ProviderSandbox |
| `exec` | manifest plus an EPP/1 process, protocol `epp/1` | CLI and Python ProviderSandbox |
| `node` | `provider.mjs` with `export default create(kit)`, protocol `node/1` | CLI and Python ProviderSandbox |

`[features] supported` is only the current non-interpreter feature ids in `docs/en/create.md`. Undeclared calls raise `E8004` before I/O. Leave `[core] inherit` empty. Do not read `ABX_SANDBOX_API_KEY`.

```bash
abx provider install ./my-cloud --link --yes
abx provider doctor my-cloud
abx provider test my-cloud
```

Without a real backend, say which variable is missing. Do not borrow another provider's key.

Each provider directory has `docs/README.md`. Update that file when you change paths, features, or what has actually been run.

## Prepare project sources

Use public CLI 0.5.6 with the current v5 template catalog for whole-template startup; upgrade them together:

```sh
abx --provider <id> template launch owner/repository//template-path --yes
```

Configure backend credentials and build prerequisites once; read that provider’s `docs/README.md`. The manager owns `prepareProject(directory, options)` under `templates.build` and returns `{reference,status:"ready"}` with optional service/readiness commands and creation metadata. Pass its exact native reference to the same provider. Use generic `kit.project.stage`, `buildImage` and `runTool` primitives; keep SDK/API mapping, authentication, polling and cluster policy in the adapter. Do not add vendor-ID switches to the host or Registry.

E2B uses its independent key and official SDK parser; Cube builds/pushes then registers natively; OpenSandbox uses the built image directly; container edition clones a configured base SandboxSet in the API-key namespace. Only operations required by the template manifest block startup; an application does not inherit a unified interpreter requirement. Templates declare `start_cmd` and `provides`, with no workflow selector. Retained provider `[workflow] inputs/startups` keys are internal capability metadata. Successful build artifacts remain for reuse; do not silently delete existing resources. OpenSandbox retains stable maturity for its accepted Docker scope; the other catalog providers remain Beta. New launch paths, profiles and inputs still need their own exact-scope evidence; maturity does not certify them.

Use `abx provider update <id> --check` to inspect a recorded Git source, then the documented consent/pin options to update. Pinned installs stay pinned. `abx provider update alicloud-express --check` reports the bundled upgrade path; built-in code is updated with the CLI, not a separately installed plugin.

See [provider operations and template startup](docs/workflows.md) ([中文](docs/workflows.zh-CN.md)).
