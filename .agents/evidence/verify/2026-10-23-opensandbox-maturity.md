# Verification: OpenSandbox maturity

- Date: 2026-10-23
- Owner: awesome-providers
- Issue: https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues/21
- Result: PARTIAL — initial implementation capture; required checks and delivery are pending.
- Scope: provider acceptance metadata / Beta-only display / synchronized bilingual guidance as owned by this repository.
- Environment: Linux, Node 22.22.2. No credentials are recorded.

## Verification plan

OpenSandbox T0 and handshake identity; project tests; required full native T4 with actual current host/SDK, project build/push/launch/probe and always-run container cleanup.

## Results

- PASS: `node tests/run.mjs` in opensandbox: 51 tests, including actual EPP handshake version matching the manifest.
- PASS: `node --test tests/project.test.mjs` at repository root: five generic project tests.
- PASS: provider manifest, package identity, local index and YAML declarations agree; only OpenSandbox maturity changes to stable.
- PENDING: fresh hosted current-CLI/current-SDK native T4 and required complete provider CI. Historical runs 39208622409 and 39767683488 remain separate evidence. Required remote checks and publication receipts are linked from the Issue/PR after completion without rewriting merged captures. Prior native receipts are historical evidence, not a newly executed current-host run.

## Cleanup and limits

Local tests use temporary checkouts and build output. Hosted native tests own disposable Docker services and must verify cleanup, including on failure. No cloud sandbox, account permission or provider capability is granted by a maturity label. Untested Kubernetes/network-policy/secure-access/code-interpreter modes remain outside the accepted scope.
