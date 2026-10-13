# Awesome Providers for Easy Sandbox

A catalog of installable sandbox provider plugins for the
[Easy Sandbox](https://github.com/Easy-Sandbox/python-sdk) Python SDK and the
[`ebx`](https://github.com/Easy-Sandbox/easy-sandbox) CLI.

Each provider is its own directory. The machine-readable index is
[`awesome-providers.yaml`](./awesome-providers.yaml) (`schema_version: 1`).
This repository does not contain the SDK or the CLI. The SDK keeps the
provider host (installer, EPP client, registry). Plugins are installed into
`~/.ebx/providers`.

## Providers

| Provider | Kind | What it is | Install |
|---|---|---|---|
| [opensandbox](./opensandbox/) | `exec` (Node, no npm dependencies) | Runs sandboxes on an [OpenSandbox](https://github.com/opensandbox-group/OpenSandbox) server | `ebx provider install https://github.com/Easy-Sandbox/awesome-providers.git --subdir opensandbox` |

## Install

`SOURCE` is a local directory or a git URL. Nothing in the plugin runs during
install. A non-interactive shell needs `--yes`. A full 40-hex `--ref` (or
`--sha256`) pins the install; a branch or tag without that pin also needs
`--allow-unpinned`.

```bash
# Pinned install from this catalog (preferred)
ebx provider install https://github.com/Easy-Sandbox/awesome-providers.git \
  --subdir opensandbox --ref <40-hex-commit> --yes

# Branch tip, explicitly unpinned
ebx provider install https://github.com/Easy-Sandbox/awesome-providers.git \
  --subdir opensandbox --allow-unpinned --yes

# Local checkout of one provider directory
ebx provider install ./opensandbox --yes

ebx provider list
ebx provider info opensandbox
```

The same store is what the Python SDK reads:

```bash
python -m easy_sandbox.providers install ./opensandbox --yes
python -m easy_sandbox.providers list
```

```python
from easy_sandbox.api.sandbox import Sandbox

sb = await Sandbox.create(provider="opensandbox")
```

## Layout

```
awesome-providers.yaml    index (schema_version, one entry per provider)
LICENSE                   Apache-2.0
opensandbox/              first provider
  ebx-provider.toml       manifest
  provider.mjs            EPP/1 entry (Node >= 20, no dependencies)
  src/                    protocol implementation
  tests/                  unit, mock, live, contract
<future-provider>/        another directory, plus an index entry
```

## Adding a provider

1. Add a top-level directory named after the provider id.
2. Put an `ebx-provider.toml` manifest in it. An `exec` plugin also needs the
   program named by `[runtime] command` (for example `provider.mjs`).
3. Register it in [`awesome-providers.yaml`](./awesome-providers.yaml): `name`
   must match `[provider].id`, and `path` must be the directory.
4. Open a pull request.

Install from a path while developing: `ebx provider install ./your-provider --yes`.
The protocol is specified in the
[Python SDK provider design](https://github.com/Easy-Sandbox/python-sdk/blob/main/docs/en/design/providers-and-credentials.md).

## 中文

这是 Easy Sandbox 的可安装沙箱提供方目录。每个提供方一个目录，根目录的
[`awesome-providers.yaml`](./awesome-providers.yaml) 是索引（`schema_version: 1`）。
本仓库不包含 Python SDK 或 CLI。SDK 只保留宿主（安装器、EPP 客户端、注册表）；
插件安装到 `~/.ebx/providers`。

目前的第一个提供方是 [opensandbox](./opensandbox/)：无 npm 依赖的 Node `exec`
插件，把沙箱跑在 [OpenSandbox](https://github.com/opensandbox-group/OpenSandbox)
服务上。

```bash
ebx provider install https://github.com/Easy-Sandbox/awesome-providers.git \
  --subdir opensandbox --ref <40位提交哈希> --yes
ebx provider list
ebx provider info opensandbox
```

新增提供方：新建顶层目录，放入 `ebx-provider.toml`（`exec` 类型还要有清单里的入口程序），
在 `awesome-providers.yaml` 增加一条（`name` 与 `[provider].id` 相同，`path` 为目录名），然后提交 PR。
许可证为 Apache-2.0。

## License

[Apache-2.0](./LICENSE). The OpenSandbox plugin in this repository is Apache-2.0.
