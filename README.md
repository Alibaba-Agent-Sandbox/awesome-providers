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
| [opensandbox](./opensandbox/) | `exec` (Node, no npm dependencies) | Runs sandboxes on an [OpenSandbox](https://github.com/opensandbox-group/OpenSandbox) server | `ebx provider install Easy-Sandbox/awesome-providers//opensandbox` |

## Install

`SOURCE` is a local directory or a git URL. Nothing in the plugin runs during
install. A non-interactive shell needs `--yes`. A full 40-hex `--ref` (or
`--sha256`) pins the install; a branch or tag without that pin also needs
`--allow-unpinned`.

`//` is the provider directory, the same spelling as `ebx template install owner/repo//subdir`. `@ref` after the directory pins a tag, branch, or commit.

```bash
# Catalog install. A full 40-hex commit in @ref pins it.
ebx provider install Easy-Sandbox/awesome-providers//opensandbox@<40-hex-commit> --yes

# Branch tip, explicitly unpinned
ebx provider install Easy-Sandbox/awesome-providers//opensandbox@main --allow-unpinned --yes

# Local checkout of one provider directory
ebx provider install ./opensandbox --yes

ebx provider list
ebx provider info opensandbox
```

`ebx provider info opensandbox` is the list of features this install actually implements. The CLI and the Python SDK both refuse anything outside that list with `E8004`. What each feature maps to, and the OpenSandbox row, is in the [CLI providers guide](https://github.com/Easy-Sandbox/easy-sandbox/blob/main/docs/en/guide/providers.md#what-you-can-run-after-installing) and the [SDK providers guide](https://github.com/Easy-Sandbox/python-sdk/blob/main/docs/en/guide/providers.md#what-you-can-call-after-installing).

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

`//` 是提供方所在子目录，和 `ebx template install owner/repo//subdir` 同一写法。目录后的 `@ref` 用来固定 tag、分支或提交。

```bash
ebx provider install Easy-Sandbox/awesome-providers//opensandbox@<40位提交哈希> --yes
ebx provider list
ebx provider info opensandbox
```

`ebx provider info opensandbox` 列出这次安装实际实现的能力。CLI 和 Python SDK 对清单之外的命令和方法都以 `E8004` 拒绝。每项能力对应哪些命令，以及 OpenSandbox 能用和不能用的对照，见 [CLI 提供商指南](https://github.com/Easy-Sandbox/easy-sandbox/blob/main/docs/zh/guide/providers.md) 和 [SDK 提供商指南](https://github.com/Easy-Sandbox/python-sdk/blob/main/docs/zh/guide/providers.md)。

新增提供方：新建顶层目录，放入 `ebx-provider.toml`（`exec` 类型还要有清单里的入口程序），
在 `awesome-providers.yaml` 增加一条（`name` 与 `[provider].id` 相同，`path` 为目录名），然后提交 PR。
许可证为 Apache-2.0。

## License

[Apache-2.0](./LICENSE). The OpenSandbox plugin in this repository is Apache-2.0.
