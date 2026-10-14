# How a provider works

A provider is a sandbox backend. `Sandbox.create` (or `abx create`) picks one, then that provider builds the control plane and the data plane. The SDK and the CLI compile in only `alicloud-express` (Alibaba Cloud Express Edition). Everything else lives in this catalog and is loaded after install.

The provider layer is written once, in Node.js, and hosted by the TypeScript CLI. The CLI uses it directly. Every SDK reaches a catalog provider through the local engine (`abx provider engine serve`, HTTP + SSE + WebSocket on `127.0.0.1`). So a provider installed once works from the CLI, the Python SDK, and later the Node, Go and Java SDKs, with the same behavior. The host, the four kinds, and the engine are specified in [Node provider architecture](../../../cli/docs/en/design/node-provider-architecture.md).

## Built-in and catalog

| Id | Where it lives | Kind |
|---|---|---|
| `alicloud-express` | Built into the SDK and the CLI | `builtin` |
| `opensandbox` | `awesome-providers/opensandbox` | `node`: EPP methods run in the host process (`kit.epp.infra`) |
| `cubesandbox` | `awesome-providers/cubesandbox` | `node`: an ES module the host loads |
| `e2b` | `awesome-providers/e2b` | `node` |
| `alicloud-container` | `awesome-providers/alicloud-container` | `node` |

Install with `abx provider install registry:<id>` or `python -m agent_sandbox.providers install registry:<id> --yes`. Both write the same `~/.abx/providers/<id>` tree, and both hosts run the same code afterwards. The Python SDK calls a catalog provider as `Sandbox.create(provider="…")`; the CLI as `abx --provider <id> create`.

`alicloud-express` is reserved and cannot be installed as a plugin. `opensandbox`, `cubesandbox`, `e2b`, and `alicloud-container` are official catalog ids: they can be installed, and they cannot be registered again as a different plugin.

## How a call picks a provider

Highest priority first:

1. `Sandbox.create(provider="…")`, or the CLI flag `--provider`
2. Process environment `ABX_PROVIDER`
3. `./.env`
4. `~/.abx/.env`
5. `[core] provider` in `~/.abx/config.toml` (written by `abx provider default`)
6. `alicloud-express`

A sandbox id belongs to the provider that created it. `connect` accepts a qualified reference such as `my-cloud:sbx-1`; the prefix is the provider. A prefix that disagrees with `provider=` is `ProviderMismatchError` (E8030).

## Loading

`get_provider` looks in this order:

1. Id `alicloud-express`: the built-in object.
2. An object registered in this process with `register_provider`.
3. The distribution entry-point group `agent_sandbox.providers`.
4. An installed plugin under `~/.abx/providers/<id>`.

An installed plugin then forks on the manifest. In the CLI the host runs it. In the Python SDK a `node` plugin goes through the engine (`EngineProvider`). The sandbox it returns is a marker `engine://<provider>/<id>` that the SDK's adapters translate into engine calls. `rest` and `exec` stay in the Python process.

| `runtime.kind` | Protocol | What the host does |
|---|---|---|
| `rest` | `e2b-rest/1` | Manifest only. The built-in HTTP client calls an E2B-shaped control plane and envd for the data plane |
| `exec` | `epp/1` | Starts the process in the manifest and speaks JSON-RPC on stdin/stdout. Install does not run the plugin |
| `node` | `node/1` | Imports the manifest `entry` (default `provider.mjs`) in the host process and calls its default export `create(kit)`. The returned `buildInfra(ctx)` yields the protocol objects. The tree digest is checked on every load unless the plugin was installed with `--link` |

Manifest-installed Python plugins (`kind = "python"`) no longer exist. A Python `Provider` subclass is still allowed in code, registered with `register_provider`.

`build_infra` returns `ProviderInfra`: protocol objects for sandbox, process, filesystem, and code interpreter. Later `commands.run`, `files.write`, and `run_code` use those objects.

An undeclared feature is rejected before any request, as `E8004` (`ProviderFeatureNotSupportedError`). `exec` rejects before writing to the plugin. `rest` and `node` wrap protocol methods with `feature_gate`. A declared feature that fails inside the backend is the backend's error, not `E8004`.

## One create

```text
Sandbox.create(provider="e2b", template="base", timeout=300)
    │
    ├─ resolve key and origin (provider_options, then ABX_<ID>_*)
    ├─ provider.build_infra(config)
    ├─ control plane POST /sandboxes (paths are in that provider's own docs)
    └─ later commands and files use the protocol objects from this call
```

`timeout` on create is the sandbox lifetime, not the HTTP timeout.

OpenSandbox does not use that HTTP client. Its module talks to OpenSandbox HTTP and the per-sandbox execd (SSE and WebSocket) itself; the host calls its EPP/1 dispatcher in process and adapts the results to the protocol objects.

## Keys stay apart

Each provider reads its own `ABX_<ID>_API_KEY` (id uppercased, `-` turned into `_`). `my-cloud` reads `ABX_MY_CLOUD_API_KEY`.

`[core] inherit` is the only way a plugin receives the Express generic keys (`sandbox_api_key`, `sandbox_base_url`, `sandbox_domain`), and install asks the user to consent. Leave `inherit` empty. The Express key `ABX_SANDBOX_API_KEY` is not sent to E2B, CubeSandbox, or the container edition.

OpenSandbox's manifest inherits nothing either. It reads `ABX_OPENSANDBOX_API_KEY` and `ABX_OPENSANDBOX_BASE_URL`.

## Background update check

`list_providers` calls `schedule_update_check()`. A daemon thread fetches the index, compares each installed receipt version with the catalog `version`, and writes differences to `~/.abx/providers/updates.json`. It does not download or replace installed files. A network error is treated as no update.

The check is skipped when:

- `ABX_PROVIDER_UPDATE_CHECK=0`
- the process is under pytest (`PYTEST_CURRENT_TEST`)

The default index is `https://registry.agent-sandbox.cn/providers/index.json`. `ABX_PROVIDER_REGISTRY` replaces it with another URL or a local path to `index.json`. The registry website is <https://registry.agent-sandbox.com>. The official site is <https://www.agent-sandbox.com>.
