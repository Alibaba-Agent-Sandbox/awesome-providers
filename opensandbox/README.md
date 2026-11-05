# opensandbox provider plugin

[简体中文](README.zh-CN.md)

Create and manage sandboxes on an existing [OpenSandbox](https://github.com/opensandbox-group/OpenSandbox) server from the Python SDK (`ProviderSandbox.create(provider="opensandbox")`) or CLI (`abx --provider opensandbox ...`). Docker-backed deployments are supported. Kubernetes-specific network policy and secure access are outside the documented support scope; native code-interpreter APIs are not implemented by this provider.

This directory is the canonical plugin. It lives in
[alibaba-agent-sandbox/awesome-providers](https://github.com/alibaba-agent-sandbox/awesome-providers), not in the Python SDK.

Python uses this Node provider through the local `abx` engine. The recommended standalone `abx` binary bundles Node, so Python users do not need a separate Node.js or npm installation. An npm-installed CLI needs Node.js 20+; interactive terminals require the engine to run Node.js 22+. See [requirements and quick setup](../docs/en/install.md#requirements).

## Install

First prepare `abx` and, for Python use, Python 3.10+ and the SDK using the [installation guide](../docs/en/install.md#quick-setup-for-python). Install this provider once:

```bash
python -m agent_sandbox.providers install registry:opensandbox --yes
python -m agent_sandbox.providers doctor opensandbox
```

This registry package path does not require Git. Installing the provider does not install or start an OpenSandbox server. Docker is needed on the client only for a local server or source-image builds; a client connecting to an existing remote service does not need it.

Use a compatible server/execd pair. The documented Docker setup uses OpenSandbox server 1.1.1 with release-1.1.1 execd; do not combine it with a moving `latest` execd image.

CLI-only users can instead install a pinned Git source (requires Git):

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

This provider's compatibility floor is CLI 0.4.16 and Python SDK 0.3.1a4. Use the current CLI for current application templates; see [template launch](https://github.com/Alibaba-Agent-Sandbox/agent-sandbox/blob/main/docs/en/guide/template-launch.md).

Before consent, inspection reads static metadata without executing the plugin. After consent, default
verification may import and initialize this Node plugin for its handshake. `--yes` accepts consent; it
does not skip verification. Regular installs check the file digest against the receipt on load;
`--link` is the development exception. See the [CLI installation and trust guide](https://github.com/Alibaba-Agent-Sandbox/agent-sandbox/blob/main/docs/en/guide/providers.md).

## Configure

The default server address is `http://127.0.0.1:8080`; do not export it again when that is your server. For another server, set its address. If that server requires authentication, obtain the OpenSandbox API key from its administrator and set it before use:

```bash
# Only when your service differs from the local, unauthenticated default:
export ABX_OPENSANDBOX_BASE_URL="https://opensandbox.example.com"
export ABX_OPENSANDBOX_API_KEY="<key supplied by your OpenSandbox administrator>"
```

This key authenticates the OpenSandbox service; it is separate from an Express Sandbox API key and from a template application's `ABX_SERVER_TOKEN`.

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

## Call path and performance

```text
Python ProviderSandbox → local abx engine → OpenSandbox provider → OpenSandbox/execd
abx CLI                → OpenSandbox provider                  → OpenSandbox/execd
```

The engine starts on demand and is reused across calls. Python command and file operations also pass through it. Compared with an equivalent native Python provider, this adds local communication, data encoding/decoding, possible data copies, and an extra process's memory. Startup and loading affect the first call; high-frequency short operations and larger transfers can expose steady-state overhead. There is no fixed millisecond or throughput guarantee for the complete SDK path. The [performance guidance](../docs/en/install.md#call-path-and-performance) explains how to assess your workload. Bundling Node in the binary simplifies setup without removing this forwarding path.

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

## Contributing

See [contribution instructions](../CONTRIBUTING.md) and [test tiers](../docs/e2e.md). The [API mapping](https://github.com/Alibaba-Agent-Sandbox/python-sdk/blob/main/docs/en/design/provider-opensandbox-mapping.md) describes the provider contract for contributors.

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
