# Install a provider

Install a provider once, then use it from the CLI or Python `ProviderSandbox`. The four catalog providers (`opensandbox`, `e2b`, `cubesandbox`, and `alicloud-container`) use a Node runtime, including when called from Python. The standalone `abx` binary includes that runtime; you do not need to install Node.js separately when using it.

## Requirements

| Use | Client requirements |
|---|---|
| Python SDK with a catalog provider | Python 3.10+, the Python SDK, `abx`, and the installed provider |
| Standalone `abx` | A supported Linux/macOS x64 or arm64 system, or Windows x64; no separate Node.js or npm |
| npm installation of `abx` | Node.js 20+ and npm; use Node.js 22+ for OpenSandbox interactive terminals |
| Provider installation from Git | Git in addition to the selected client |
| Python `registry:<id>` installation | Access to the registry index and package downloads; Git is not needed |

You also need access to the selected backend and any credentials it requires. Connecting to an existing remote OpenSandbox server does not require Docker on the client. Docker is needed when you run that server locally or build source-template images. Other providers have their own requirements; read the provider's README before creating resources.

These Node requirements apply to catalog providers with `runtime.kind = "node"`. The built-in Express provider and Python-hosted `rest`/`exec` providers use different paths; an `exec` provider needs the runtime of its own command.

## Quick setup for Python

Install the standalone CLI on macOS or Linux:

```bash
curl -fsSL https://www.agent-sandbox.cn/install.sh | sh
```

On Windows, use PowerShell:

```powershell
irm https://raw.githubusercontent.com/Alibaba-Agent-Sandbox/agent-sandbox/main/install.ps1 | iex
```

Follow the installer's PATH instructions and check `abx --version`. See [binary installation](https://github.com/Alibaba-Agent-Sandbox/agent-sandbox/blob/main/docs/en/guide/binary-installation.md) for supported platforms, version selection, checksums and manual downloads. Python can also locate an executable through `ABX_BIN` when it is not on PATH.

In your active Python environment, install the SDK and the provider you want:

```bash
python -m pip install "agent-sandbox-client==0.4.0a6"
python -m agent_sandbox.providers install registry:opensandbox --yes
python -m agent_sandbox.providers doctor opensandbox
```

The SDK, engine and provider are separate installations. `pip install agent-sandbox-client` does not install `abx` or a catalog provider. Once prepared, subsequent Python programs reuse the installed engine and provider. Installing the OpenSandbox client provider does not start an OpenSandbox server.

If you already use Node.js, npm is an alternative to the binary installer:

```bash
npm install -g @agent-sandbox/cli@0.5.8 --registry=https://registry.npmjs.org
```

Choose either the binary or npm installation of `abx`; both supply the engine used by Python. An OpenSandbox server at `http://127.0.0.1:8080` needs no address export. For a different address or an authenticated server, follow [OpenSandbox configuration](../../opensandbox/README.md#configure). Other provider IDs can replace `opensandbox` in the Python install command.

## From the official catalog

```bash
abx provider install alibaba-agent-sandbox/awesome-providers//opensandbox --allow-unpinned --yes
abx provider install alibaba-agent-sandbox/awesome-providers//cubesandbox --allow-unpinned --yes
abx provider install alibaba-agent-sandbox/awesome-providers//e2b --allow-unpinned --yes
abx provider install alibaba-agent-sandbox/awesome-providers//alicloud-container --allow-unpinned --yes
```

`--allow-unpinned` is required without a terminal because `main` moves; pass `--ref <40-hex-commit>` instead to pin.

The Python installer can do the same from the index: `python -m agent_sandbox.providers install registry:<id> --yes` reads the index, turns that row into a local directory, then runs a normal install. Only the Python installer has the `registry:` form (`abx` does not), use the public index, the git form above, or a local index (below). Both write the same directory; the plugin runs the same way afterwards.

The default index is `https://registry.agent-sandbox.cn/providers/index.json`. The registry website is <https://registry.agent-sandbox.com>. The official site is <https://www.agent-sandbox.com>. To point the installer elsewhere:

```bash
export ABX_PROVIDER_REGISTRY=/path/to/awesome-providers/index.json
python -m agent_sandbox.providers install registry:opensandbox --yes
```

`ABX_PROVIDER_REGISTRY` may be an https URL, a `file:` URL, or a local path to an `index.json` that already exists. This repository's index uses relative directories (`url` is `opensandbox` and so on). Pointed at that file, the installer uses the sibling directory. Pointed at an https index, `url` must be a tar.gz: the installer downloads it, checks `sha256` when present, extracts it, and if the archive has a single directory and no manifest at the root, uses that directory.

Without a terminal, pass `--yes` or the install stops with `E8012`. `--yes` means the consent screen was reviewed. It does not skip verification.

## From a directory or git

```bash
python -m agent_sandbox.providers install ./my-cloud --yes
python -m agent_sandbox.providers install ./my-cloud --link --yes

python -m agent_sandbox.providers install \
  https://github.com/you/abx-provider-my-cloud.git \
  --ref <40-hex-commit> --yes
```

`abx provider install` takes the same flags. Both tools install `rest`, `exec` and `node` providers.

A source is pinned with a 40-hex commit (`--ref`) or `--sha256 <tree digest>`. A tag or branch is unpinned. An unpinned ref is accepted only after a person reads the consent screen in a terminal, or with `--allow-unpinned`. `--yes` alone never accepts a moving ref; the error prints the commit to pin.

Only `https://` and ssh git URLs are accepted. A URL with an embedded password is rejected. `file://`, `http://`, and `git://` need `--allow-insecure-transport` and are for development and tests.

## After install

```text
~/.abx/providers/
  <id>/
    abx-provider.toml
    ...plugin files
    .abx-install.json     # source, commit, digest, consent
    data/                 # plugin state, not hashed
```

```bash
python -m agent_sandbox.providers list
python -m agent_sandbox.providers doctor opensandbox
python -m agent_sandbox.providers uninstall opensandbox
```

`uninstall` removes the directory. Settings for that id under `~/.abx` stay unless you pass `--purge`. If the removed provider was the default, the default returns to `alicloud-express`.

Installing an id that is already present needs `--force`.

## Update check and a real update

Listing providers starts a background compare of the index `version` and the receipt version, and writes differences to `~/.abx/providers/updates.json`. That file is a notice. Replacing files is explicit:

```bash
python -m agent_sandbox.providers update opensandbox --check
python -m agent_sandbox.providers update opensandbox --yes
```

Turn the background check off with `ABX_PROVIDER_UPDATE_CHECK=0`.

## Calling it after install

The four official providers are all `node`. After install, call them from the CLI (`abx --provider e2b create`) or from the Python SDK:

```python
import asyncio
from agent_sandbox import ProviderSandbox as Sandbox

async def main() -> None:
    async with await Sandbox.create(
        provider="opensandbox",
        template="base",
        timeout=300,
    ) as sb:
        print((await sb.commands.run("echo ok", timeout=30)).stdout)

asyncio.run(main())
```

Each provider's environment variables are in that directory's `docs/README.md`. A missing install is `ProviderNotFoundError`, and the message names the install command.

After any install, both the CLI and the SDK can call it: `abx --provider my-cloud create --template base`. The Python SDK starts the local engine (`abx provider engine serve`) when it needs one, so the `abx` CLI must be on `PATH` (or named in `ABX_BIN`) for the SDK to call a `node` provider. An `exec` provider runs its manifest command directly from the Python host; it does not use that Node engine.

## Call path and performance

```text
Python ProviderSandbox → local abx engine → provider → backend
abx CLI                → provider        → backend
```

Python uses local HTTP, SSE and WebSocket connections to the engine. The engine starts when needed and is reused; it is not a new Node process for each SDK call. Command execution and file operations also follow this path. The CLI runs the same provider directly in its own process. See [how providers work](principle.md) for the available provider types.

Compared with an equivalent native Python provider that calls the backend directly, the Node-provider path adds local communication, data encoding/decoding and an engine process's memory. The first call can also pay for engine startup and provider loading. Large responses and file transfers can incur additional copies or encoding; concurrent calls can compete for the engine's CPU and connections.

There is no fixed per-call overhead or throughput guarantee for this complete SDK/provider path. Backend creation and long-running commands may dominate total latency, while frequent short commands and small-file operations can make the added cost more visible. Measure your actual operations with reused connections, and separate startup latency, steady-state latency, concurrency, transfer throughput and memory. For serial calls, the additional time accumulates approximately as the number of calls multiplied by the additional time per call.

Using the standalone binary simplifies installation; it retains the local engine and the same forwarding path. It does not make a Node provider into a native Python provider.
