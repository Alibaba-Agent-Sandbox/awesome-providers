# Create a provider

A provider is a directory: `abx-provider.toml`, plus the program that runtime needs. Do not put it in the SDK or CLI repository. A new backend is a new subdirectory here, plus one row in `index.json`.

Pick a runtime first. All three install under `~/.abx/providers/<id>`. The CLI loads only the first two.

| Kind | What you write | When |
|---|---|---|
| `rest` | Manifest only | The backend is E2B HTTP: `POST /sandboxes` with `templateID`, header `X-API-Key` or bearer, envd at `https://{port}-{id}.{domain}` |
| `exec` | Manifest plus a process | The API is not E2B-shaped. Any language. The process speaks EPP/1. Nothing runs at install time |
| `python` | Manifest plus `load()` in `provider.py` | You need a Python class in the SDK process. The CLI does not load this kind |

Do not start from the Express engine. Do not read `ABX_SANDBOX_API_KEY`. That key is Express only.

## Directory

```text
my-cloud/
  abx-provider.toml
  provider.py          # only when kind = "python"
  README.md            # this provider's own notes
```

An `exec` plugin keeps its executable in the same directory. `command` uses a relative path. The executable must stay inside the plugin directory, and it cannot be a `.bat`, `.cmd`, or `.ps1` launcher.

## Id

Match `^[a-z][a-z0-9]*(-[a-z0-9]+)*$`, length 2 to 40.

Not allowed:

- Reserved ids: `alicloud-express`, `default`, `all`, `none`, `builtin`, `shortcuts`, `core`, `transport`, `providers`
- Reserved prefixes: `abx-`, `alicloud-`, `shortcuts`
- Ids already in the official catalog: `opensandbox`, `cubesandbox`, `e2b`, `alicloud-container`

`alicloud-container` can be installed because the installer exempts official catalog ids. A new Alibaba Cloud backend cannot start with `alicloud-`.

## Manifest

Name the secret field `api_key`. The environment variable is derived from the id. Add `env = [...]` only when you also accept the vendor's own variable names.

```toml
manifest_version = 1

[provider]
id = "my-cloud"
name = "My Cloud"
name_zh = "我的云"
version = "0.1.0"
description = "What this backend is."
license = "Apache-2.0"

[compat]
protocol = "python/1"
requires = { sdk = ">=0.3" }

[runtime]
kind = "python"
entry = "provider.py"

[features]
supported = [
  "sandbox.lifecycle",
  "exec.run",
  "files.rw",
]

[security]
network = ["api.example.com"]

[auth]
any_of = [["api_key"]]

[config.fields.api_key]
type = "string"
secret = true
credential = true
description = "API key. Set ABX_MY_CLOUD_API_KEY."
description_zh = "API 密钥。设置 ABX_MY_CLOUD_API_KEY。"

[core]
inherit = []
```

For `rest`, set `protocol` to `e2b-rest/1`, `kind` to `rest`, and add `[endpoint]`:

```toml
[runtime]
kind = "rest"

[endpoint]
base_url = "https://api.example.com"
domain = "sandboxes.example.com"
auth = { scheme = "header", header = "X-API-Key" }
```

`domain` is the suffix in `https://49983-{sandboxID}.{domain}`. An `envdUrl` on the create response wins.

For `exec`, set `protocol` to `epp/1` and add `command`:

```toml
[runtime]
kind = "exec"
command = ["python", "./provider.py"]
startup_timeout_ms = 10000
call_timeout_ms = 60000
```

`[security]` is text on the consent screen. The host does not sandbox the process from it. Write the network and files the plugin actually touches.

## Only these 18 feature ids

An unknown id is rejected at install. A call whose id is absent raises `E8004` before any request.

```
sandbox.lifecycle   create, list, get, connect, kill
sandbox.timeout     set_timeout
sandbox.pause       pause and resume
exec.run            commands.run
exec.stream         commands.stream
process.manage      process list, stdin, signal
pty                 get_terminal
files.rw            read, write, list, move, remove
files.watch         files.watch
files.transfer      upload_url / download_url
code.interpret      run_code
templates.read      template list
templates.build     template build
ports.url           network.resolve_url
ports.domain        a separate domain feature
storage.mount       volume mount
network.vpc         VPC
sessions            named commands on the in-sandbox server
```

Declare a feature only when the backend implements that call. A declared feature that 404s is worse than `E8004`, because the caller thinks the request was sent.

An API outside those 18 ids is an extension, not a new feature id. On a Python `Provider`, set `extensions = (Extension(id, summary, summary_zh, implemented, when),)`. `when` is `sandbox`, `code_interpreter_image`, `egress`, or `command`. `implemented=False` still raises `E8004` from `require_extension`. Manifest `[features.extensions.*]` is documentation; the installer does not parse it.

## Python entry

```python
from agent_sandbox.providers import Provider
from agent_sandbox.providers.feature_gate import gate_protocol

class MyCloud(Provider):
    id = "my-cloud"
    display_name = "My Cloud"
    kind = "python"
    features = frozenset({"sandbox.lifecycle", "exec.run", "files.rw"})
    inherit = frozenset()

    async def build_infra(self, config):
        # Build the HTTP client from config.provider_options and ABX_MY_CLOUD_*.
        # Pass protocol objects through gate_protocol so undeclared methods
        # become E8004 before any request.
        ...

def load() -> MyCloud:
    return MyCloud()
```

`load()` is the entry after install. `register_provider` is only for in-process registration; the installer does not call it.

An `exec` process receives configuration in `initialize`. It must not read the parent environment. Secrets arrive only there. The method table and error codes are in [authoring.md](../authoring.md).

## Add it to the index

Add one object under `providers` in `index.json`:

```json
{ "id": "my-cloud", "version": "0.1.0", "url": "my-cloud" }
```

A relative `url` points at the sibling directory. This repository is set up that way, so `ABX_PROVIDER_REGISTRY` can point at this `index.json` for a local install.

When publishing to `https://registry.agent-sandbox.cn/providers/index.json`, `url` should be a `.tar.gz`. The installer treats an http(s) body as a tar archive and checks `sha256` when that field is set. A local directory is not packed.
