# Release integration verification — 2026-10-24

Result: PARTIAL

## Candidate and scope

Reapplied the previous release patch on current public main `f6c04ad8bb33c80e9927364b0deff13ee7abb4a7`, preserving its reviewed host pins and workflow evidence. The integration code commit is `8468f307da1a95f94cf44c585b78d3bd63d20cb9`; subsequent scoped documentation clarifies that the Registry consumes the source `index.json`, while YAML and the local installer index must stay synchronized. No new provider capability or backend is introduced.

Tracking: https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues/27.

## Passed locally

- `node opensandbox/tests/run.mjs`: 63 passed, 0 skipped, exit 0. Includes final GET failure, cancellation-independent cleanup, cleanup failure recovery, and success retention.
- `node --test tests/project.test.mjs tests/workflow-operations.test.mjs`: 16 passed, exit 0.
- `node cubesandbox/tests/run.mjs`: 10 passed, exit 0.
- `E2B_TEMPLATE_SDK_MODULE=<installed official SDK module> node e2b/tests/run.mjs`: 13 passed, 0 skipped, exit 0. Uses the previously locked CLI dependency installation, official E2B 2.55.0, and loopback backend.
- Current Markdown link checker from the template repository, invoked with this repository as explicit root: 33 documents, 0 failures.
- All four distributable provider directories contain nonempty applicable LICENSE files. Newly added files retain the repository root license bytes.
- `git -c core.filemode=false diff --check`: passed before the evidence-only update.

## Remaining gates

No Docker executable is available locally; T1 installed-host and T4 native execution were not rerun locally. The existing PR workflow remains responsible for real Docker acceptance at this head. Earlier host receipts do not certify a changed plugin. No cloud resources were created, and no provider/registry publication or merge is claimed by this record. Remote checks and current-head review remain required.
