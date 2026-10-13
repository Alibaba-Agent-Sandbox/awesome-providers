# Writing a provider

[简体中文](authoring.zh-CN.md)

A provider is an installable sandbox backend. One directory in this repository is one provider. The Python SDK and the `ebx` CLI do not contain provider implementations; they install a directory from here into `~/.ebx/providers/<id>` and talk to it.

Copy [opensandbox/](../opensandbox/) when the backend is a real HTTP service, or the `local-process` example in the Python SDK (`examples/providers/local-process/`) when you want the smallest exec plugin.

## How `ebx create` reaches your plugin

`ebx create` never imports your code. It calls `Sandbox.create`. That call chooses a provider before any sandbox API runs.

```text
ebx --provider my-cloud create --template base
        │
        │  1. The CLI takes --provider and --opt off the command line
        │     (any position) and keeps them for this process only.
        ▼
Sandbox.create({ template, timeout, envs, metadata, ... })
        │
        │  2. Provider id, first match wins:
        │     provider= argument
        │     > --provider
        │     > EBX_PROVIDER
        │     > ./.env  >  ~/.ebx/.env
        │     > [core] provider in ~/.ebx/config.toml
        │     > alicloud-express
        ▼
   alicloud-express? ── yes ──► built-in Alibaba Cloud client.
        │                         Your plugin is not started.
        no
        ▼
   3. Read ~/.ebx/providers/my-cloud. Check the tree digest (E8011 if a
      file changed). Do not start the process when the digest fails.
        ▼
   4. Spawn the manifest command. cwd is the plugin directory.
      Environment is scrubbed: PATH, locale, EBX_PROVIDER_DATA_DIR,
      and only the env names the manifest listed.
        ▼
   5. initialize → plugin returns features.
        ▼
   6. sandbox.create → SandboxRecord with sandbox_id.
        ▼
   7. The CLI prints my-cloud:<sandbox_id>. Later exec / files / kill
      use that id. A feature you did not declare fails with E8004
      and the method is not sent.
```

`Sandbox.create(template="base", provider="my-cloud")` in Python starts at step 2. It uses the same installed directory.

These do not enter your plugin:

- `ebx create --template base` with no provider selected. That is `alicloud-express`.
- `ebx create "a node api"` with a sentence and no `--template`. The CLI first runs the built-in template authoring pipeline (generate, build, deploy). Only the final create uses the selected provider. Launch a plugin with `ebx --provider my-cloud create --template <image-or-name>`.

## What you ship

```text
my-cloud/
  ebx-provider.toml    required
  provider.mjs         or provider.py; whatever [runtime] command names
  README.md            what works, what returns E8004, how to configure
```

`exec` plugins are one process speaking JSON-RPC 2.0, one JSON object per line, on stdin/stdout. No npm or pip install at plugin install time. `rest` plugins are a manifest only: an E2B-protocol base URL.

Declare a feature only when you implement every method the host sends for it. The machine-readable list is `docs/design/fixtures/epp-methods.json` in the CLI repository.

| Feature | Methods you must answer |
|---|---|
| (always) | `initialize`, `shutdown` |
| `sandbox.lifecycle` | `sandbox.create`, `sandbox.get`, `sandbox.list`, `sandbox.kill`. `sandbox.connect` is optional (`-32601` makes the host call `sandbox.get`) |
| `sandbox.timeout` | `sandbox.set_timeout` |
| `sandbox.pause` | `sandbox.pause`, `sandbox.resume` |
| `exec.run` | `exec.run` |
| `exec.stream` | `exec.start`, then notifications `exec.output` and one `exec.exit` |
| `process.manage` | `process.list`, `process.kill`, `process.signal`, `process.stdin` |
| `files.rw` | `files.read`, `files.write`, `files.list`, `files.stat`, `files.mkdir`, `files.remove`, `files.move` |
| `ports.url` | `ports.url` |

`sandbox.create` params: `template`, `timeout`, `metadata`, `envs`, `cpu`, `memory`, `disk`, `gpu`, `request_timeout`, and `secure` / `options` only when the caller set them. The result needs `sandbox_id`. Also return `template`, `status`, `metadata`, `envd_url` or `url`, `envd_access_token`, `created_at`, `expires_at`, `region` when you have them.

No `envd_url` means the host keeps using EPP (`epp://<provider>/<sandbox_id>`). An `http(s)` `envd_url` means later file, process, and terminal calls use the E2B envd transport and do not come back to your process.

## Develop

```bash
ebx provider install ./my-cloud --link --yes
ebx provider doctor my-cloud
ebx provider test my-cloud
ebx --provider my-cloud create --template base
ebx exec my-cloud:<id> "echo hello"
```

`--link` is a development symlink. It skips the digest check and prints a warning. A real install copies the files and checks the digest on every start.

Config reaches the plugin only inside `initialize.config`. Secret fields are not accepted as `--opt` (they would land in shell history). Users set them with `ebx config set providers.<id>.<key>`.

## Add it to this catalog

1. Directory name equals `[provider].id`.
2. Add an entry to [`awesome-providers.yaml`](../awesome-providers.yaml): `name`, `path`, `description`, `kind`, `license`, `status`.
3. README states which CLI commands and SDK methods work, which return E8004, and which are partial.
4. Open a pull request. Install from the catalog with `ebx provider install Easy-Sandbox/awesome-providers//my-cloud`.

## For an AI agent

Install [`SKILL.md`](../SKILL.md) (`name: easy-sandbox-provider`) into the coding tool before editing a plugin. The skill is the same rules as this page, in the form an agent loads: where the code lives, the create call path, the method names, and the checks to run.
