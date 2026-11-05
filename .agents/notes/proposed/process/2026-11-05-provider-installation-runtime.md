# Provider installation and runtime guidance

Status: proposed

## Problem

Python users cannot tell whether a Node catalog provider needs a separate Node installation, the `abx` engine, a provider install, or all three. OpenSandbox's public README says `node` must be on PATH, omitting the standalone CLI binary's embedded runtime. Installation guides omit the shortest supported environment setup and the cost of the Python-to-engine path. Public pages also contain historical test narratives and stale manual application-token instructions.

## Decision

Document the existing standalone-binary installer as the recommended engine preparation, with npm as an alternative. Explain Python, platform, Git and Docker requirements separately. Keep the real Python `registry:` provider installation and make default-address and credential setup conditional. Explain the reused engine's call path, cold-start and steady-state costs without promoting a synthetic loopback measurement into an SDK performance guarantee.

Update the English/Chinese installation guides, OpenSandbox READMEs, its bilingual usage page and the changelog. Preserve existing engineering evidence. Historical test narratives and low-level HTTP mappings leave the user guides; contribution and design references remain available. Preserve the published CLI 0.5.8 noninteractive application-token workaround while recommending interactive generation for a normal first launch.

## API Design

No runtime API, provider manifest, feature, source catalog, release artifact or CLI command changes. The documented public installation remains `python -m agent_sandbox.providers install registry:opensandbox --yes`, after preparing the SDK and `abx`. The proposed `agent-sandbox-client[opensandbox]` extra is not presented as available. `ABX_OPENSANDBOX_BASE_URL` is optional for the default local address; an authenticated server's key comes from that server's administrator.

## Alternatives considered

- Requiring npm and Git for every Python user: unnecessary for standalone `abx` plus Python registry-package installation.
- Claiming one pip command already installs every component: unsupported by the released package and dependency metadata.
- Publishing the earlier approximately 4 ms synthetic result as product overhead: it did not exercise the full SDK, provider or real backend.
- Rewriting catalog providers in Python: outside this documentation change and not necessary to explain current requirements.

## Dependencies

- [CLI binary installation](https://github.com/Alibaba-Agent-Sandbox/agent-sandbox/blob/main/docs/en/guide/binary-installation.md).
- [Python engine discovery](https://github.com/Alibaba-Agent-Sandbox/python-sdk/blob/main/client-sdk/src/agent_sandbox/providers/engine_client.py).
- [Python SDK installation](https://github.com/Alibaba-Agent-Sandbox/python-sdk/blob/main/docs/en/guide/install-python.md).
- A reachable OpenSandbox service for actual resource operations. This patch does not deploy one.

## Test Strategy

Check changed-document relative links and anchors, verify this record's seven required sections and proposed status, inspect the scoped diff, and run `git diff --check`. Run OpenSandbox's existing T0 suite required by the contribution guidance. Separately distinguish binary installation and provider-handshake validation from a full real-backend call-path or performance comparison.

## Acceptance criteria

- Both languages state that Python uses a Node engine for Node providers, while standalone `abx` includes that runtime.
- The installation guide names Python, platform, npm, Git, backend and Docker requirements and exposes the existing quick installer.
- OpenSandbox's default address, service-key source and application-token distinction are clear.
- The call path, process reuse, first-call costs and workload-dependent steady-state overhead are explained without fixed benchmark claims.
- No unimplemented pip extra or unsupported CLI `registry:` syntax is advertised.
- Documentation/link/record checks and mandatory T0 pass; merge and external runtime checks are reported separately.

## Evidence

[Scoped verification](../../../evidence/verify/2026-11-05-provider-installation-runtime.md).
