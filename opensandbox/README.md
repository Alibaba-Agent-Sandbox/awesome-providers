# opensandbox provider plugin

Accepted scope: Docker backend with OpenSandbox server 1.1.1 and digest-pinned release-1.1.1 execd, including CLI, Python SDK, project build/launch and cleanup. Kubernetes, network policies, secure access and code interpreter are outside this acceptance. See [provider acceptance](../docs/acceptance.md).

[简体中文](README.zh-CN.md)

An [EPP/1](https://github.com/Alibaba-Agent-Sandbox/python-sdk/blob/main/docs/en/design/providers-and-credentials.md) **Node provider** that runs Agent
Sandbox sandboxes on an [OpenSandbox](https://github.com/opensandbox-group/OpenSandbox) server
(Docker or Kubernetes runtime). It works unchanged from the Python SDK (`ProviderSandbox.create(provider="opensandbox")`)
and from the `abx` CLI (`abx --provider opensandbox ...`).

This directory is the canonical plugin. It lives in
[alibaba-agent-sandbox/awesome-providers](https://github.com/alibaba-agent-sandbox/awesome-providers), not in the Python SDK.

* Runtime: **Node.js >= 20, no npm dependencies** (built-in `fetch`; the terminal needs the global `WebSocket` of Node 22+). Chosen because the `abx` CLI is a
  Node program, so every `abx` user already has Node; the Python SDK needs `node` on `PATH` to use it.
* Design and API mapping: [`provider-opensandbox-mapping.md`](https://github.com/Alibaba-Agent-Sandbox/python-sdk/blob/main/docs/en/design/provider-opensandbox-mapping.md).
* Authoring review that produced this plugin: [`provider-authoring-evaluation.md`](https://github.com/Alibaba-Agent-Sandbox/python-sdk/blob/main/docs/en/design/provider-authoring-evaluation.md).

## Install
This provider revision requires CLI 0.4.16+ and Python SDK 0.3.1a4+ for source preparation and authenticated template applications through the server proxy.

```bash
abx provider install alibaba-agent-sandbox/awesome-providers//opensandbox@<40-hex-commit> --yes
abx provider info opensandbox          # the features this install declares
abx provider doctor opensandbox
```

`//opensandbox` is the subdirectory, the same `//` as `abx template install owner/repo//subdir`. A git URL with `--subdir` still works; the two forms must not disagree.

A local checkout of this directory works with the same command (`abx provider install ./opensandbox --yes`).
A branch or tag without a 40-hex `--ref` is unpinned and needs `--allow-unpinned` when there is no terminal.
`file://` and other plain-text transports also need `--allow-insecure-transport`. The Python installer accepts the same source:

```bash
python -m agent_sandbox.providers install ./opensandbox --yes
```

Before consent, inspection reads static metadata without executing the plugin. After consent, default
verification may import and initialize this Node plugin for its handshake. `--yes` accepts consent; it
does not skip verification. Regular installs check the file digest against the receipt on load;
`--link` is the development exception. See the [CLI installation and trust guide](https://github.com/Alibaba-Agent-Sandbox/agent-sandbox/blob/main/docs/en/guide/providers.md).

## Configure

Every field can be set with the canonical `ABX_OPENSANDBOX_<FIELD>` variable, in `~/.abx/config.toml`
under `[providers.opensandbox]`, or (where listed) with the OpenSandbox-native variable. Canonical names win.

| Field | Native alias | Default | Meaning |
|---|---|---|---|
| `base_url` | | `http://127.0.0.1:8080` | Server root (a trailing `/v1` is accepted) |
| `api_key` (secret) | `OPEN_SANDBOX_API_KEY` | none | Sent as `OPEN-SANDBOX-API-KEY`; a local server may need none |
| `domain`, `protocol` | `OPEN_SANDBOX_DOMAIN`, `OPEN_SANDBOX_PROTOCOL` | `http` | `host[:port]` alternative to `base_url` |
| `use_server_proxy` | `OPEN_SANDBOX_USE_SERVER_PROXY` | `false` | Route sandbox traffic through the server proxy |
| `default_image` | | `python:3.12-slim` | Image for the generic template `base` |
| `image_aliases` | | `code=opensandbox/code-interpreter:v1.1.0` | `name=image,...` short template names |
| `entrypoint` | | `tail -f /dev/null` | Explicit keepalive default. The template launcher runs the declared `start_cmd` through exec to start all application services. Image names never select runtime scripts; a different process requires explicit configuration |
| `ready_timeout` | | `60` | Seconds to wait for Running + execd |
| `registry_username`, `registry_password` (secret) | | none | Private registry auth |
| `network_policy` | | none | JSON NetworkPolicy for every new sandbox (overridable per create) |
| `platform` | | none | `linux/amd64`, `linux/arm64`, ... |
| `secure_access` | | `false` | Kubernetes gateway secure access |

The template argument of `ProviderSandbox.create(template=...)` is resolved as: alias, then `base` -> `default_image`,
otherwise used as an image reference verbatim.

## What the CLI and the SDK can call

Both hosts load this plugin. A method or command works only when its feature is in the manifest. Anything else raises `E8004` before a request is sent. `abx provider info opensandbox` prints the declared set.

| You want | CLI | SDK | This provider |
|---|---|---|---|
| Create, list, info, kill, connect again by id | `create`, `list`, `info`, `kill`, `connect` | `ProviderSandbox.create/connect/list`, instance `kill` | yes (`sandbox.lifecycle`, `sessions`) |
| Run a process, including streamed output | `exec` (no standalone streaming command) | `commands.run`, `commands.stream` | yes |
| Call a template command | `run` | application client `commands.run` | requires the template application service |
| Files, upload, download | `upload`, `download`, `sandbox files` | `files.*` | yes |
| Change TTL, pause, resume | Use the SDK for this provider | `set_timeout`, `pause`, `resume` | yes |
| Port endpoint and access headers | no standalone URL command | `await network.resolve(port)` | yes |
| Process list, signal, kill | `sandbox process` | `commands.list/kill` | partial: stdin is E8004; an execd command id accepts only SIGKILL |
| Interactive terminal | no standalone PTY command (`connect` is a line REPL) | `get_terminal` | yes when the provider engine runs Node 22+ |

`template` on create is a container image. `base` means `default_image` (`python:3.12-slim` unless you change it).

## Capabilities

| Feature | Status | Notes |
|---|---|---|
| `sandbox.lifecycle` | yes | create (waits for Running and execd, kills on failure), connect, get, list (paged), kill (idempotent) |
| `sandbox.timeout` | yes | `set_timeout`; OpenSandbox's 60 s minimum is clamped; the new expiry is derived from the server clock |
| `sandbox.pause` | yes | pause / resume (Docker runtime) |
| `exec.run`, `exec.stream` | yes | env, cwd, user, stdin, timeout; ordered `exec.output` / one `exec.exit`; `$/cancel` stops the command |
| `process.manage` | partly | `process.list`; `process.kill` / `process.signal` (numeric pid: any signal; execd command id: SIGKILL only); `process.stdin` is `E8004` |
| `files.rw` | yes | read (offset/length), write (mode), list, stat, mkdir, remove, move, plus `files.search` and `files.chmod` extensions (not called by any host yet) |
| `ports.url` | yes | `ports.url` method (direct endpoint, or the server proxy with `use_server_proxy`) |
| `sessions` | yes | detached commands through the `detached` extension of `exec.start` (no host adapter sends it yet) |
| `pty` | yes (Node 22+) | `pty.open` creates an execd terminal (`POST /pty`) and bridges its WebSocket (`/pty/{id}/ws`): input is `0x00` + bytes, `pty.output` carries the output, `pty.exit` ends it. On Node 20/21 there is no global WebSocket, so the plugin does not advertise `pty` |
| `code.default-context.execute`, EPP template RPCs, `files.watch`, transfer URLs | no | `E8004` (`-32003`) |

## Test

```bash
node tests/run.mjs                      # 24 unit + 21 mock-server tests, no server needed
```

Live tiers need a reachable OpenSandbox server. The one-command local setup is the SDK
harness ([e2e/opensandbox](https://github.com/Alibaba-Agent-Sandbox/python-sdk/blob/main/e2e/opensandbox/README.md));
that harness starts the server and installs this plugin, it is not a second copy of it.

```bash
export ABX_OPENSANDBOX_BASE_URL=http://127.0.0.1:8080
export OPEN_SANDBOX_API_KEY=...         # whatever your server expects
OPENSANDBOX_LIVE=1 node tests/run.mjs live                         # plugin over EPP/1 directly
OPENSANDBOX_LIVE=1 python -m pytest tests/contract                 # contract kit + SDK scenarios
```

`tests/contract` needs `agent_sandbox` importable and `pytest`; it installs the plugin into a temporary
`~/.abx` and never touches your real store.

## Layout

```
abx-provider.toml   manifest (runtime, features, security, config schema)
provider.mjs        entry: EPP dispatcher and capability wiring
src/                http.mjs (lifecycle + execd client), sandbox.mjs, exec.mjs, files.mjs,
                    sse.mjs, multipart.mjs, convert.mjs, config.mjs, errors.mjs, epp.mjs
tests/              unit/, mock/ (in-process fake server), live/, contract/ (pytest)
```

## Known limits

* File reads/writes are limited by EPP's 8 MiB line limit (reads are capped at 4 MiB per call; use `offset`/`length`).
* `secure=True` passed to `ProviderSandbox.create` requests gateway "secure access" (Kubernetes gateway deployments only; a Docker server refuses it). `secure=False` and an omitted `secure` leave it off, or use the `secure_access` config field for a global default.
* Per-create settings: `provider_options={"network_policy": ..., "platform": ..., "default_image": ...}` given to `ProviderSandbox.create` override the configured values for that sandbox only (whitelist: `default_image`, `image_aliases`, `entrypoint`, `ready_timeout`, `registry_username`, `registry_password`, `network_policy`, `platform`, `secure_access`; never the server address or API key).
* `commands.start()` is lazy for every provider (nothing is sent until the stream is iterated); run `nohup ... &` through `commands.run(..., shell=True)` to start a background process.
* Streaming startup requires the native execd `init` event and its process identifier. Missing acknowledgment fails without fabricating an ID or replaying an uncertain command.
* The execd backend must support native `argv` requests and preserve output bytes. Older execd interfaces are unsupported; command failures are returned without retrying another protocol.

Licensed under Apache-2.0.

## Project source preparation / 项目源码准备

The Node template manager supports `templates.build` for `abx template launch`: Docker builds and pushes the source and OpenSandbox consumes the returned image reference. The EPP template RPCs in the table remain unsupported. See [prerequisites and acceptance scope](docs/README.md).

Node 模板管理器通过 `templates.build` 支持 `abx template launch`：Docker 构建并推送源码，OpenSandbox 使用返回的镜像引用。上表中的 EPP 模板 RPC 仍不支持。参见[前置条件与验收范围](docs/README.md)。

### Create failure cleanup

A create failure after an ID is known attempts deletion even when the caller cancelled, including a failed final detail read. The original error remains primary. If cleanup fails, EPP error data includes `cleanup: {sandbox_id, status: "failed"}` and a recovery warning; inspect and delete that owned sandbox. A successful DELETE is not an independent proof of backend absence.
