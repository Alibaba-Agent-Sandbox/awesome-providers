---
name: easy-sandbox-provider
description: >-
  Write an installable Easy Sandbox provider plugin (EPP/1) that the ebx CLI and
  the Python SDK both load. Use when adding a sandbox backend, implementing
  sandbox.create, or explaining how ebx create reaches a provider.
  编写可安装的 Easy Sandbox provider：调用链、EPP/1 方法、清单和目录仓库的提交方式。
---

# Easy Sandbox provider

Write a provider plugin. Do not add the plugin to the Python SDK or the CLI repository. Add a directory to [Easy-Sandbox/awesome-providers](https://github.com/Easy-Sandbox/awesome-providers).

Human guide: [docs/authoring.zh-CN.md](docs/authoring.zh-CN.md) and [docs/authoring.md](docs/authoring.md). Method list: `docs/design/fixtures/epp-methods.json` in the CLI repository. Copy `opensandbox/` for a real HTTP backend.

## Call path

`ebx create` calls `Sandbox.create`. It does not import the plugin.

1. `--provider` / `--opt` are taken off the argv in `main()` and stored for this process.
2. Provider id: `provider=` argument, then `--provider`, then `EBX_PROVIDER`, then `./.env`, then `~/.ebx/.env`, then `[core] provider`, then `alicloud-express`.
3. `alicloud-express` uses the built-in client. The plugin process is not started.
4. Any other id loads `~/.ebx/providers/<id>`, checks the tree digest, and spawns the manifest command with a scrubbed environment.
5. The host sends `initialize`, then `sandbox.create`.
6. The plugin returns `sandbox_id`. The CLI prints `<id>:<sandbox_id>`.
7. Later commands check the declared feature first. A missing feature is `E8004` and the method is not sent.

`ebx create "some description"` without `--template` runs the built-in template authoring pipeline before that create. It is not implemented by the plugin. Tell the user to run `ebx --provider <id> create --template <image-or-name>`.

Python `Sandbox.create(template=..., provider="<id>")` starts at step 2 and uses the same installed directory.

## Implement

- One directory. Name equals `[provider].id`. Files: `ebx-provider.toml`, the program named by `[runtime] command`, and a README.
- `exec`: JSON-RPC 2.0, one JSON object per line, stdin/stdout. No package install step.
- Declare only features whose methods you implement.
- `sandbox.lifecycle`: `sandbox.create`, `sandbox.get`, `sandbox.list`, `sandbox.kill`. `sandbox.connect` is optional.
- `exec.run` is `exec.run`. Streaming (`exec.stream`) is `exec.start` plus `exec.output` / `exec.exit` notifications. There is no method named `exec.stream`.
- `files.rw` uses `files.move`, not `rename`. `process.manage` uses `process.stdin`, not `send_stdin`.
- `sandbox.create` must return `sandbox_id`. Omit `envd_url` to stay on EPP. An `http(s)` `envd_url` switches later file and process calls to the envd transport.
- Secrets go through `initialize.config` only. Never read `EBX_SANDBOX_API_KEY` unless `[core] inherit` lists it and the user consented.
- Do not log config values marked `secret`.

## Checks

```bash
ebx provider install ./my-cloud --link --yes
ebx provider doctor my-cloud
ebx provider test my-cloud
ebx --provider my-cloud create --template base
```

`provider test` is the contract suite. A declared feature that fails the contract is a bug. An undeclared feature must come back as E8004.

## Catalog PR

Add the directory and one `awesome-providers.yaml` entry (`name`, `path`, `description`, `kind`, `license`, `status`). The README table must say what works, what is partial, and what returns E8004. Install line for users:

```bash
ebx provider install Easy-Sandbox/awesome-providers//my-cloud
```

`//` is the subdirectory, the same spelling as `ebx template install owner/repo//subdir`.
