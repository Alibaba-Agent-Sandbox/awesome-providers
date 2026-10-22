# Verification: remove retired project compatibility

- Date: 2026-10-22
- Result: PARTIAL (remote acceptance pending)
- Revision: scoped files in branch `refactor/remove-legacy-20261022`; the containing commit is the reviewable source revision.
- Environment: Linux, Node.js 22.22.2; Python 3.11.15 in an isolated environment.
- Issue: https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues/18

## What was verified

Retired project APIs, migration fields and fallbacks are removed rather than forwarded. Tests and bilingual documentation describe one current contract. Historical engineering evidence is preserved.

## Commands and results

- PASS: `node opensandbox/tests/run.mjs` — 51 unit/mock tests, including one-request failure without old-protocol replay and exact output bytes.
- PASS: `node cubesandbox/tests/run.mjs` — 10 tests.
- PASS: E2B `node tests/run.mjs` with the pinned official e2b@2.55.0 module — 13 tests, including real SDK calls against loopback HTTP. The SDK loopback test allows 60 seconds for cold dependency loading; a separate short-deadline regression still verifies cancellation.
- PASS: `node --test tests/project.test.mjs` — five tests.
- PASS: `git -c core.filemode=false diff --check`.
- BLOCKED locally: T4 requires Docker, which is unavailable here. The existing native Docker workflow remains required. The upstream release-1.1.1 execd specification documents argv and byte-preserving foreground output: https://raw.githubusercontent.com/opensandbox-group/OpenSandbox/release-1.1.1/specs/execd-api.yaml . This source check is not a native backend pass.

## Outstanding gates

Required remote CI, review and merge are not established by local results. Initial Git invocations had not loaded the ignored workspace credential file; authenticated fetch and GitHub access now succeed. No package release or manual production deployment is requested. Cross-repository consumers must land after their shared contract.

## Cleanup

Local fixtures use owned temporary resources. The Python cloud fixture tracks and cleans its own sandbox resources. No raw credentials or sensitive logs are included. Native checks that did not execute are not passes.
