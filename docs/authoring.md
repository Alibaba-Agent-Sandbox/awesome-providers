# Authoring a provider

This is the contributor guide for the catalog. The same material, split by task, is in [How a provider works](en/principle.md), [Create](en/create.md), [Develop](en/develop.md), and [Install](en/install.md). Chinese: [文档目录](README.md).

An agent should load [SKILL.md](../SKILL.md) instead of this page.

## What you are adding

A provider plugin is a directory with `abx-provider.toml`. The SDK and the CLI ship only `alicloud-express`. This catalog holds everything else. Publish one directory per provider and add a row to `awesome-providers.yaml` and keep the source `index.json` consistent. The Registry currently reads `index.json` to select package directories; the same index supports local Python installation.

Three runtimes:

| Kind | Protocol | What you write |
|---|---|---|
| `rest` | `e2b-rest/1` | Manifest only |
| `exec` | `epp/1` | A process that speaks JSON-RPC on stdin/stdout, any language |
| `node` | `node/1` | `provider.mjs`: an ES module the host loads, default export `create(kit)` |

The CLI hosts all three runtimes. Python `ProviderSandbox` uses the local CLI engine for `node` plugins, starts an `exec` plugin process directly, and calls `rest` backends directly over HTTP. The independent Node.js SDK is an application HTTP client and does not load providers; other clients need an implemented bridge. Manifest-installed Python plugins (`kind = "python"`) are gone. All four (`opensandbox`, `e2b`, `cubesandbox`, `alicloud-container`) are `node`. Install the Git tree with `abx provider install alibaba-agent-sandbox/awesome-providers//<id> --allow-unpinned --yes`, or use the Python registry installer: `python -m agent_sandbox.providers install registry:<id> --yes`.

Installation inspects static metadata before consent; after consent, default handshake verification may load plugin code. `--yes` does not skip that verification. See the [installation guide](en/install.md).

## Id, features, secrets

The id matches `^[a-z][a-z0-9]*(-[a-z0-9]+)*$`, length 2–40. Do not reuse `alicloud-express` or the catalog ids `opensandbox`, `cubesandbox`, `e2b`, `alicloud-container`. Do not start a new id with `abx-`, `alicloud-`, or `shortcuts`.

`[features] supported` may contain only the current non-interpreter feature ids listed in [Create](en/create.md). Anything else is rejected at install. A call whose id is absent raises `E8004` before I/O.

Name the key `api_key`. The variable is `ABX_<ID>_API_KEY`. Leave `[core] inherit` empty unless the user asked to share `sandbox_api_key`, `sandbox_base_url`, or `sandbox_domain`. Never copy `ABX_SANDBOX_API_KEY` into the new provider.

## EPP/1 methods

An `exec` plugin answers these JSON-RPC methods. A method you did not implement must not be listed under `supported`.

| Group | Methods |
|---|---|
| handshake | `initialize`, `shutdown` |
| `sandbox.lifecycle` | `sandbox.create`, `sandbox.get`, `sandbox.list`, `sandbox.kill`. `sandbox.connect` is optional: on `-32601` the host calls `sandbox.get` |
| `sandbox.timeout` / `sandbox.pause` | `sandbox.set_timeout`, `sandbox.pause`, `sandbox.resume` |
| `exec.run` / `exec.stream` | `exec.run`. Streaming is `exec.start`, then `exec.output` / `exec.exit` notifications |
| `process.manage` | `process.list`, `process.kill`, `process.signal`, `process.stdin` |
| `files.rw` | `files.read`, `files.write`, `files.list`, `files.stat`, `files.mkdir`, `files.remove`, `files.move` |
| `ports.url` | `ports.url` |

`sandbox.create` returns a record with `sandbox_id`. Also return, when you have them: `template`, `status`, `metadata`, `envd_url`, `envd_access_token`, `created_at`, `expires_at`, `region`. An `http(s)` `envd_url` means later file, process, and terminal calls use the envd transport. No `envd_url` means the host keeps talking to the plugin (`epp://<id>/<sandbox_id>`).

| Situation | JSON-RPC | User-facing code |
|---|---|---|
| Feature missing | `-32003` | `E8004` |
| Unknown sandbox on get / connect / timeout / pause / resume | `-32002` | `E2009` |
| Other missing object, no `sdk_code` | `-32002` | `E8005` |

`sandbox.kill` of an unknown sandbox is not an error. The plugin may succeed or answer `-32002`.

Configuration arrives only in `initialize`. The process starts with a scrubbed environment.

## Check before you publish

```bash
python -m agent_sandbox.providers install ./my-cloud --link --yes
python -m agent_sandbox.providers doctor my-cloud
python -m agent_sandbox.providers test my-cloud
```

Pin a git install to a 40-hex commit. Write a README that matches the consent screen: command, features, security block, config fields. Put the provider's own notes under `<id>/docs/`.

See [exact workflow operations](workflows.md) ([中文](workflows.zh-CN.md)).
