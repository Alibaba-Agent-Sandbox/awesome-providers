# Verification: Exec installation host

Date: 2026-10-24
Result: PARTIAL — local checks passed; final CI/review pending.
Base: `6eec4e76bb955a2a8cd89f725e66bb7887d6c819`.
Tracking: [Issue 34](https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues/34).
Scope: final paragraph of bilingual installation guides and engineering records.

## Executed

- Python provider registry loads kind=node as EngineProvider, kind=rest as RestProvider, and kind=exec as ExecProvider. Read ExecProvider implementation to confirm it launches the manifest command from the Python host. The independent Node engine is not required for that branch.
- Preserved the existing valid `from agent_sandbox import ProviderSandbox as Sandbox` example; its alias is not the root standard Sandbox API.
- Relative document targets and `git diff --check`: PASS.
- Required OpenSandbox T0 `node tests/run.mjs`: 63 PASS, zero failures/skips. Documentation and runtime are unchanged from the same-code test run linked in the preceding installation-consent record; no new support is inferred.

## Limits

No runtime/version/catalog change. No manually initiated backend test or cloud resource. The existing PR workflow may automatically run its OpenSandbox T4; it remains a normal merge gate. This correction does not claim full-template coverage.
