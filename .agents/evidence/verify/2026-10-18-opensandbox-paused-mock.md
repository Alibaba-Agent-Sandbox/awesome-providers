# OpenSandbox paused mock verification

Result: PASS

Date: 2026-10-18. Base: `873f033`. Scoped files:
`opensandbox/tests/mock/mock-opensandbox.mjs`,
`opensandbox/tests/mock/epp.test.mjs` and their engineering records. Environment:
Node 22.22.2, managed Linux workspace with loopback HTTP forwarding.

Commands actually run:

- Baseline `node tests/run.mjs` from `opensandbox/`: exit 1; 50 passed, 1 failed.
  Paused socket reset became HTTP 502, so the expected network-error message differed.
- Changed `node tests/run.mjs` from `opensandbox/`: exit 0; 51 passed, no skips.
  The paused regression checks failure code, retryability, HTTP 503 and paused-state
  text, then resumes and executes `true` successfully. The independent unreachable
  server test also passes.

The loopback mock removes each sandbox temp directory and closes HTTP/upgraded
connections in its existing finally cleanup. No cloud resources were created.
This is T0 mock verification only. T1/T3/T4 were not run because this change affects
only test fixtures; no install or real-backend behavior is changed or claimed.

The PR's normal remote T0 remains a separate required delivery check.
Issue: https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues/6.
