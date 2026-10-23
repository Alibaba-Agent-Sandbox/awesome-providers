# Merge accepted upstream provider scope into workflow implementation

Result: PARTIAL

Date: 2026-10-23. Scope: normal merge of main `64b799c` into the workflow branch previously at `9a1eaaa`. No history was rewritten and no unrelated checkout was changed.

## Resolution

Preserve upstream PR22/24 records, native receipts and accepted OpenSandbox Docker maturity (`stable`). Retain the new strict operation contract and higher plugin versions (OpenSandbox 0.5.0, other changed plugins 0.4.0). Align OpenSandbox package, handshake, manifest and index version identity. Keep both independent engineering-record indexes.

Maturity and current workflow evidence remain separate. Upstream accepted Docker/stock-image receipts do not automatically certify the new specification-4 source/profile or Python prepared-image workflow. No historical receipt is edited or promoted. Other providers remain Beta.

Merge the workflow changes without dropping the actual template checkout/profile test. The CLI checkout now uses the coordinator-selected reviewed `58a4d77` revision; the final Python SDK producer pin remains a required coordinated update before the new T4 result can establish acceptance.

## Executed checks

Node 22 development host:

- PASS: `node opensandbox/tests/run.mjs`: 54 tests, no skips.
- PASS: `node --test tests/project.test.mjs tests/workflow-operations.test.mjs`: 12 tests, no skips.
- PASS: `node cubesandbox/tests/run.mjs`: 10 tests, no skips.
- PASS: `E2B_TEMPLATE_SDK_MODULE=<reviewed CLI dependency> node e2b/tests/run.mjs`: 13 tests, no skips, official SDK 2.55.0.
- PASS: `git diff --check`; conflict markers removed from all resolved files.

These are unit/loopback tests. Docker is unavailable locally, no cloud resources were created, and final exact-producer T4/current-head CI remains pending. The normal merge resolves the PR conflict; it is not itself native acceptance or publication.

[Owner Issue](https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues/23); [PR](https://github.com/Alibaba-Agent-Sandbox/awesome-providers/pull/25).
