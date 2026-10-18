# Verification: provider-owned catalog metadata

- Date: 2026-10-18.
- Result: PARTIAL; metadata checks and E2B T0 pass; existing OpenSandbox/reference-provider environment failures remain explicit.
- Base: a1105adff79d6f1e4671850daaa6789f9a106ec9 plus metadata, manifest/index patch versions, bilingual docs and records.
- Environment: Linux, Node 22.22.2. No native backend credentials used.

## Commands and results

- JSON/manifest/index consistency: PASS for all four providers. Only version/display metadata changes; original supported-feature sets remain unchanged and templates.deploy remains undeclared.
- `cd e2b && node tests/run.mjs`: 12 pass / 1 skip (official SDK absent).
- Install official `e2b@2.55.0` in an isolated temporary directory using the existing CI's exact version and lifecycle-script policy; repeat with `E2B_TEMPLATE_SDK_MODULE=<module URL> node tests/run.mjs`: 13 pass / zero skips. The actual SDK exercises loopback, not E2B cloud.
- `cd opensandbox && node tests/run.mjs`: 50 pass / 1 fail. The unchanged paused-sandbox mock expects a direct connection error; this environment returns HTTP 502. The accepted separate fix is https://github.com/Alibaba-Agent-Sandbox/awesome-providers/pull/7; this branch's base predates it. No runtime/test expectation is weakened here.
- CLI reference suites for existing adapters: 30 pass / 6 fail, with recorded loopback/proxy HTTP behavior. They are not native backend passes.
- Scoped Markdown links and diff: PASS. Final staged configured-secret scan: PASS, 15 paths.

## Ownership, packaging and cleanup

Each catalog.json is inert provider-owned display data. Manifest/index patch versions reflect changed package bytes; source examples do not activate the unverified E2B/Cube image factories. Registry ingestion is independently owned and tested. No install of a user's provider store, account mutation or native cloud deployment occurred. The native E2B/Cube/container acceptance prerequisites remain absent; previous cloud evidence is not copied into this record. A recovered two-day-old empty Git index lock was preserved under a non-lock metadata backup name before staging; no source/history was discarded.
