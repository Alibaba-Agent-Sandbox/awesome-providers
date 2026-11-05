# Provider installation and runtime guidance verification

Result: PASS

Date: 2026-11-05

## Scope

Base: `8a584c22cae2ef0d04edf08110ee756684e4878f`.

Documentation-only changes to `docs/en/install.md`, `docs/zh/install.md`, `opensandbox/README.md`, `opensandbox/README.zh-CN.md`, `opensandbox/docs/README.md`, the changelog and this repository's engineering record/index. No provider source, manifest, catalog or release change.

## Executed validation

- `node tests/run.mjs` from `opensandbox/`: exit 0; 63 passed, 0 failed, 0 skipped. This is the existing local unit/mock T0 suite, not real OpenSandbox verification.
- Python standard-library relative-link/anchor and engineering-record audit over the seven changed existing Markdown files and two new records: exit 0; 102 relative references checked, no missing files or anchors. The audit checked the seven required record sections and `Status: proposed` against its directory. All three Python code blocks parsed successfully with `ast.parse`; they were not executed against a backend.
- `git diff --check`: exit 0.
- Follow-up scoped review: the CLI cleanup example explicitly selects `--provider opensandbox` for the raw sandbox ID, matching its creation command; final `git diff --check` exited 0.

## Reviewed behavior and limits

The official CLI binary-installation guide describes an embedded runtime and the existing website/PowerShell installers. Python engine discovery finds `ABX_BIN` or `abx` on PATH and reuses a healthy running engine. The OpenSandbox provider's default address is local port 8080; registry package installation and Git installation have different client prerequisites.

The earlier loopback forwarding probe is not a complete SDK/provider benchmark. No synthetic millisecond value is copied into user documentation. No full native-Python comparison, concurrent-load test, file-throughput test or real OpenSandbox operation was run by this documentation subtask.

The coordinating installation check separately used a fresh Linux home and PATH without Node/npm/Git/abx, installed the official standalone v0.5.8 binary and published Python SDK 0.4.0a6, and installed registry OpenSandbox 0.5.1 with its default handshake. Repeated doctor calls reused the engine. This confirms the client preparation/handshake path on Linux; it does not prove OpenSandbox service operations or every advertised platform. The owning [Python runtime setup evidence](https://github.com/Alibaba-Agent-Sandbox/python-sdk/blob/main/.agents/evidence/verify/2026-11-05-provider-runtime-setup.md) records that check independently; this record does not duplicate its full transcript.

## Cleanup and delivery

The T0 suite uses its own local mock processes; no cloud resources, OpenSandbox instances, keys or release artifacts were created. The original dirty workspace checkout was left unchanged. Commit, PR, CI and merge states remain pending the coordinating delivery.
