# Verification: Exec installation host

Date: 2026-10-24
Result: PASS — scoped verification and independent review passed; final record-only head remains subject to required merge checks.
Base: `6eec4e76bb955a2a8cd89f725e66bb7887d6c819`.
Tracking: [Issue 34](https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues/34).
Scope: final paragraph of bilingual installation guides and engineering records.

## Executed

- Python provider registry loads kind=node as EngineProvider, kind=rest as RestProvider, and kind=exec as ExecProvider. Read ExecProvider implementation to confirm it launches the manifest command from the Python host. The independent Node engine is not required for that branch.
- Preserved the existing valid `from agent_sandbox import ProviderSandbox as Sandbox` example; its alias is not the root standard Sandbox API.
- Relative document targets and `git diff --check`: PASS.
- Required OpenSandbox T0 `node opensandbox/tests/run.mjs` from the repository root: fresh run, 63 PASS, zero failures/skips; no new support is inferred.

- [CI 40118470736](https://github.com/Alibaba-Agent-Sandbox/awesome-providers/actions/runs/40118470736) passed all four T0 jobs on content `5936366`. Independent review confirmed both sentences match the actual loader. The OpenSandbox live workflow is not selected by these guide-only paths.

## Limits

No runtime/version/catalog change. No manually initiated backend test or cloud resource. The normal PR T0 workflow applies; no T4 run was triggered for these paths. This correction does not claim full-template coverage.
