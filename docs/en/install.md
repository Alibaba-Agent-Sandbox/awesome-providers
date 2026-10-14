# Install a provider

Install copies files into `~/.abx/providers/<id>` and writes a receipt. There is no install hook. After the files are in place it builds the provider once (the handshake) and rolls the directory back if that load fails. A missing API key or domain is configuration, not a failed install: the directory stays, and the first `create` reports the missing value. `--no-verify` skips the handshake. A git source is not checked out; the installer writes the files itself.

## From the official catalog

```bash
python -m agent_sandbox.providers install registry:opensandbox --yes
python -m agent_sandbox.providers install registry:cubesandbox --yes
python -m agent_sandbox.providers install registry:e2b --yes
python -m agent_sandbox.providers install registry:alicloud-container --yes
```

`registry:<id>` reads the index, turns that row into a local directory, then runs a normal install.

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

The CLI takes the same flags for `exec` and `rest`: `abx provider install`. Install a `python` provider with the Python module.

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

The four official providers in this catalog are `python`. After install:

```python
import asyncio
from agent_sandbox import Sandbox

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

After an `exec` or `rest` install, both the CLI and the SDK can call it: `abx --provider my-cloud create --template base`.
