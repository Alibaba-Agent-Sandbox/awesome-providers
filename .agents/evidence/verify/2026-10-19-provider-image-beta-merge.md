# Verification: Lazy E2B template SDK request

Date: 2026-10-19
Result: PARTIAL (native third-party acceptance explicitly deferred by maintainer)

## Scope and environment
Base cc617b54c9fa06e5ce5a8b590b517733d215efa6; scoped changes: e2b/provider.mjs, e2b/tests/templates.test.mjs, e2b/abx-provider.toml, index.json, e2b/docs/README.md and this repository's records. Node 22.22.2; actual optional e2b 2.55.0 SDK from the host's locked installation. No real credentials were supplied.

## Commands and results
- PASS: E2B_TEMPLATE_SDK_MODULE=<file URL to the pinned SDK> node tests/run.mjs (inside e2b): 14 passed, zero failed/skipped. Includes official SDK HTTP sequence, error/privacy/deadline regressions, lazy helper opt-in and older constructor fallback.
- PASS: built-host local E2B installation and from-image invocation using e2e/providers/template-image.mjs from CLI PR42. The actual plugin and official SDK made exactly three loopback requests; independent key, private registry parameters, resource/readiness mapping and strict safe output verified.
- PASS: sibling CubeSandbox installed-host fixture used its separate native API with two loopback requests and CPU-to-millicore mapping. This validates host composition without E2B ID dispatch; it is not E2B cloud validation.
- PASS: git diff --check and catalog version match (0.2.3).

## Limitations and cleanup
Native E2B build/create/execute/kill is unrun; no independent native account key is available. The maintainer explicitly allows third-party providers to remain Beta without formal native acceptance. Public templates.deploy remains undeclared; Issue4 remains open. CLI PR42 supplies the helper contract before this consumer merges. Temporary installed-provider HOME directories and loopback listeners were removed in finally blocks. No cloud resource was created. Remote exact-head CI and merge state are checked separately before delivery.

https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues/14
https://github.com/Alibaba-Agent-Sandbox/agent-sandbox/pull/42
