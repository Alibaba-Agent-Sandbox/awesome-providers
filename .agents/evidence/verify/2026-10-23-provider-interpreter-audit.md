# Project interpreter and documentation audit

Result: PARTIAL

Date: 2026-10-23. The earlier same-day exact-operation implementation was audited against the actual wire classes. E2B's project plugin still constructed a host class using unverified inferred Connect RPC paths. This did not constitute a working interpreter bridge. Historical mocked behavior is not promoted to current native acceptance.

## Correction

E2B declares no `code.*` operation and returns E8004 before code payload I/O. The unused inferred kit class is removed by the CLI owner. Cube/container retain only their independently implemented Jupyter POST `/execute` default-context handler, with loopback shape coverage; they remain Beta with native acceptance unrun. Explicit contexts and streaming are refused. Platform standard SDK behavior remains separate.

OpenSandbox's missing-runtime response now reports an execution environment prerequisite (`runtime-missing`), rather than fabricating a missing `code.interpret` feature or inferring image contents. Adapter unsupported errors name the project adapter. Remove the unused interpreter-image heuristic and stale instructions for implicit base-image replacement or inferred entrypoints. Public docs identify the current CLI/Python Provider bridges and keep the Node.js HTTP client separate.

## Executed verification

- PASS: `node --test tests/project.test.mjs tests/workflow-operations.test.mjs`: 12 tests, no skips. Includes rejection before constructing guessed interpreter transport and no payload I/O.
- PASS: `node opensandbox/tests/run.mjs`: 54 tests, no skips, including runtime/environment error attribution.
- PASS: pinned official E2B Template SDK `2.55.0` loaded from the reviewed CLI dependency tree with `E2B_TEMPLATE_SDK_MODULE`; `node e2b/tests/run.mjs`: 13 tests, no skips. This validates template preparation/SDK parser loopback behavior, not native interpreter support or real E2B cloud execution.
- The native project T4 script now requires immutable `name@sha256:...` output from CLI preparation for its Python prepared-image workflow.

Docker is unavailable on this host. Final exact CLI/SDK revision pins, real OpenSandbox T4 and cross-repository current-head CI remain required. Local unit tests created no cloud resources. No historical receipt was rewritten and no provider maturity was promoted.

[Owner Issue](https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues/23).
