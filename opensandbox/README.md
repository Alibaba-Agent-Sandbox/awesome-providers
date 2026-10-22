# opensandbox provider plugin

**Status: Beta.** Formal acceptance is pending. Declared capabilities do not imply live-backend end-to-end verification. Only Alibaba Cloud Express is currently Stable; scoped test results do not automatically promote this provider.

[简体中文](README.zh-CN.md)

An [EPP/1](https://github.com/alibaba-agent-sandbox/agent-sandbox/blob/main/python-sdk/docs/en/design/providers-and-credentials.md) **exec provider** that runs Agent
Sandbox sandboxes on an [OpenSandbox](https://github.com/opensandbox-group/OpenSandbox) server
(Docker or Kubernetes runtime). It works unchanged from the Python SDK (`Sandbox.create(provider="opensandbox")`)
and from the `abx` CLI (`abx --provider opensandbox ...`).

This directory is the canonical plugin. It lives in
[alibaba-agent-sandbox/awesome-providers](https://github.com/alibaba-agent-sandbox/awesome-providers), not in the Python SDK.

* Runtime: **Node.js >= 20, no npm dependencies** (built-in `fetch`; the terminal needs the global `WebSocket` of Node 22+). Chosen because the `abx` CLI is a
  Node program, so every `abx` user already has Node; the Python SDK needs `node` on `PATH` to use it.
* Design and API mapping: [`provider-opensandbox-mapping.md`](https://github.com/alibaba-agent-sandbox/agent-sandbox/blob/main/python-sdk/docs/en/design/provider-opensandbox-mapping.md).
* Authoring review that produced this plugin: [`provider-authoring-evaluation.md`](https://github.com/alibaba-agent-sandbox/agent-sandbox/blob/main/python-sdk/docs/en/design/provider-authoring-evaluation.md).

## Install

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

Installing does not execute anything; the plugin runs only when a command uses it, and its files are
re-hashed against the install receipt before every start.

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
| `entrypoint` | | `tail -f /dev/null` | Used when the caller does not set one. Keeps a stock image alive. Set `python3 commands.py` for a generated image that serves port 9000. An explicit value wins; the code-interpreter image keeps its runtime script unless overridden |
| `ready_timeout` | | `60` | Seconds to wait for Running + execd |
| `registry_username`, `registry_password` (secret) | | none | Private registry auth |
| `network_policy` | | none | JSON NetworkPolicy for every new sandbox (overridable per create) |
| `platform` | | none | `linux/amd64`, `linux/arm64`, ... |
| `secure_access` | | `false` | Kubernetes gateway secure access |

The template argument of `Sandbox.create(template=...)` is resolved as: alias, then `base` -> `default_image`,
otherwise used as an image reference verbatim.

## What the CLI and the SDK can call

Both hosts load this plugin. A method or command works only when its feature is in the manifest. Anything else raises `E8004` before a request is sent. `abx provider info opensandbox` prints the declared set.

| You want | CLI | SDK | This provider |
|---|---|---|---|
| Create, list, info, kill, connect again by id | `create`, `list`, `info`, `kill`, `connect` | `Sandbox.create/connect/list/kill` | yes (`sandbox.lifecycle`, `sessions`) |
| Run a command, including streamed output | `exec`, `run`, `sandbox shell-stream` | `commands.run`, `commands.stream` | yes |
| Files, upload, download | `upload`, `download`, `sandbox files` | `files.*` | yes |
| Change TTL, pause, resume | `sandbox timeout/pause/resume` | `set_timeout`, `pause`, `resume` | yes |
| Public URL of a port | `sandbox url` | `network.get_url` | yes |
| Process list, signal, kill | `sandbox process` | `commands.list/kill` | partial: stdin is E8004; an execd command id accepts only SIGKILL |
| PTY, `run_code`, EPP template RPCs, file watch, signed URLs, domains, OSS, VPC | those commands | `get_terminal`, `run_code`, EPP template RPCs | no (E8004) |

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
| `code.interpret`, EPP template RPCs, `files.watch`, transfer URLs | no | `E8004` (`-32003`) |

## Test

```bash
node tests/run.mjs                      # 24 unit + 21 mock-server tests, no server needed
```

Live tiers need a reachable OpenSandbox server. The one-command local setup is the SDK
harness ([e2e/opensandbox](https://github.com/alibaba-agent-sandbox/agent-sandbox/blob/main/python-sdk/e2e/opensandbox/README.md));
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
* `secure=True` passed to `Sandbox.create` requests gateway "secure access" (Kubernetes gateway deployments only; a Docker server refuses it). `secure=False` and an omitted `secure` leave it off, or use the `secure_access` config field for a global default.
* Per-create settings: `provider_options={"network_policy": ..., "platform": ..., "default_image": ...}` given to `Sandbox.create` override the configured values for that sandbox only (whitelist: `default_image`, `image_aliases`, `entrypoint`, `ready_timeout`, `registry_username`, `registry_password`, `network_policy`, `platform`, `secure_access`; never the server address or API key).
* `commands.start()` is lazy for every provider (nothing is sent until the stream is iterated); run `nohup ... &` through `commands.run(..., shell=True)` to start a background process.
* The execd backend must support native `argv` requests and preserve output bytes. Older execd interfaces are unsupported; command failures are returned without retrying another protocol.

Licensed under Apache-2.0.

## Project source preparation / 项目源码准备

The Node template manager supports `templates.build` for `abx template launch`: Docker builds and pushes the source and OpenSandbox consumes the returned image reference. The EPP template RPCs in the table remain unsupported. See [prerequisites and Beta limits](docs/README.md).

Node 模板管理器通过 `templates.build` 支持 `abx template launch`：Docker 构建并推送源码，OpenSandbox 使用返回的镜像引用。上表中的 EPP 模板 RPC 仍不支持。参见[前置条件与 Beta 范围](docs/README.md)。
