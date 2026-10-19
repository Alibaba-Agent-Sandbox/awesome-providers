# End-to-end plan

[简体中文](e2e.zh-CN.md)

Every provider in this catalog is tested in the same tiers. A tier that cannot run is a skip with a reason, not a pass.

| Tier | What it proves | Command | Needs |
|---|---|---|---|
| T0 | This provider's unit and mock tests | `node tests/run.mjs` in the provider directory | Node >= 20 |
| T1 | Install, consent, pin, tamper, doctor, uninstall. No sandbox is created | `cli/e2e/providers/run.sh offline` and `python-sdk/e2e/opensandbox/provider_install_e2e.py` | git, Node, the SDK |
| T2 | Create, exec, files, and kill through `abx`, with a provider that needs no cloud | `cli/e2e/providers/run.sh local-process` | Python 3 |
| T3 | The install line users type: `abx provider install alibaba-agent-sandbox/awesome-providers//<name>` | `cli/e2e/providers/run.sh catalog` | git and GitHub |
| T4 | A real backend this plugin talks to. For OpenSandbox that is a local server | `local-up.sh up`, then `run.sh opensandbox` and `provider_e2e.py` | Docker for OpenSandbox |
| T5 | The built-in Alibaba Cloud provider. Not a test of this catalog | `npm run e2e` in the CLI repo, `make e2e` in the SDK repo | cloud credentials |

## Rules

- Throwaway `HOME`. Do not touch the developer's real `~/.abx`.
- Do not print API keys. `provider config list` must not contain them.
- A feature the plugin does not declare must fail as `E8004`.
- Do not use `abx create "a sentence"` as a provider test. Use `abx --provider <id> create --template <image-or-name>`.
- Kill only the sandboxes this run created.

## What a pull request includes

T0 passes. The README says what works, what is partial, and what returns E8004. T1 installs the new directory. T4 is required only when the plugin calls a backend you can start in the pull request.

The copy of this table that the CLI and SDK repositories keep is `cli/e2e/providers/PLAN.md`.

## Automated OpenSandbox native checks

The `OpenSandbox live integration` workflow runs T4 on a disposable Ubuntu Docker runner using reviewed CLI/SDK commits, server 1.1.1 and a digest-pinned execd image. It runs direct EPP, installed SDK contracts, configuration precedence and the CLI round trip, then removes all test containers from that isolated runner. No cloud credentials are used. This scoped Docker result does not promote OpenSandbox from Beta or prove Kubernetes/network-policy/code-interpreter coverage.
