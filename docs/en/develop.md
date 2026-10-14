# Develop a provider

While developing, install with a link so edits do not need a reinstall. A link install does not check the tree digest. It is for the local machine.

```bash
python -m agent_sandbox.providers install ./my-cloud --link --yes
python -m agent_sandbox.providers doctor my-cloud
python -m agent_sandbox.providers test my-cloud
```

`--link` requires `--yes`. Without it the error is `ProviderTrustError` (E8012).

The CLI has the same commands for `exec` and `rest`: `abx provider install ./my-cloud --link --yes`, then `abx provider doctor` and `abx provider test`. A `python` provider uses the Python module above. The CLI rejects a manifest whose `kind` is `python`.

## What to look at

1. `doctor` checks the manifest, `requires`, configuration, and the handshake.
2. `test` runs the contract suite. Features you did not declare are skipped, not failed. A declared feature you did not implement fails. The suite covers lifecycle, exec, streaming, files, processes, timeouts, and error mapping.
3. A local fake TCP server should show the request path and the auth header, and that `ABX_SANDBOX_API_KEY` is not sent.
4. With a real backend, the minimum live check is create, one command, one file round-trip, and kill. Without a backend, skip that check and name the missing variable. Do not borrow another provider's key.

The contract suite needs pytest. `python -m agent_sandbox.providers test my-cloud` and `abx provider test my-cloud` run the same kit.

## After the manifest changes

A link install reads the source directory. A normal install copies files to `~/.abx/providers/<id>` and records a SHA-256 tree digest in `.abx-install.json`. Every file except `data/` is in the digest. The digest is checked again on start. A mismatch is `ProviderIntegrityError` (E8011).

Use `--link` while developing. Before you hand the plugin to someone else, install once without `--link` and read the consent screen.

`provider update` re-fetches the recorded source. If the command, the security block, or the feature list changed, consent is required again. An install pinned to a 40-hex commit or `--sha256` does not move; pass a new `--ref` to change it. If the new version fails its handshake, the previous files and `data/` are restored.

## Match the backend

Compare the adapter with that backend's current OpenAPI or official SDK, not with an old fake server in this repository. The fake server only shows that the adapter sent the request you told it to send.

After that, record three things in the provider's own `docs/`:

- which features are declared, and which path each one calls
- which calls raise `E8004`
- which calls ran against a real backend, and which were checked against docs only

The four official providers record that in their own `docs/README.md`. Differences that still need a real backend are collected in [Catalog and review](catalog.md).

## Skill for an agent

An agent that is writing a provider should load `python-sdk/agent-sandbox-provider/SKILL.md`, or [SKILL.md](../../SKILL.md) in this catalog. Both say the same thing: pick a kind, list real features, do not touch the Express key, and do not claim a live run when the backend was not there.
