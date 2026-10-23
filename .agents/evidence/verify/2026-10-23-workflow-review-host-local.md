# Verification: workflow review host pins

- Date: 2026-10-23
- Result: PASS for local T0, pin and record checks; new-head Docker acceptance is pending.
- Base: 6dbb89a256371190e7ea34dca858c9a00ebdfc2f.
- Scope: workflow producer pins, bilingual integration guidance, changelog and owner records. Plugin code, manifests, maturity and operation declarations are unchanged.

## Verified inputs and commands

The workflow now uses reviewed CLI 7958f13d72a02995a21e1d18b7883fb2777da514 and templates 4235f53a8d8c74e504f0441d985ab26243889b4f. Their sources are published in https://github.com/Alibaba-Agent-Sandbox/agent-sandbox/pull/123 and https://github.com/Alibaba-Agent-Sandbox/awesome-templates/pull/198. SDK runtime remains the tested 3aa5e5ae6bd9c843f62c6689e549437f460b382d. The released server/execd pair and every native assertion/cleanup step are unchanged.

- `node opensandbox/tests/run.mjs`: 57 passed, 0 skipped, 0 failed; exit 0.
- `node --test tests/project.test.mjs tests/workflow-operations.test.mjs`: 16 passed, 0 skipped, 0 failed; exit 0.
- `git -c core.filemode=false diff --check`: passed.
- Reviewed the exact workflow diff: only two immutable producer revisions changed. No additional cloud or production deployment step was introduced.

## Pending acceptance and resource ownership

Ordinary CI and the complete actual Docker T4 must run against this head before merge. Older host passes do not certify these changes. The existing workflow creates disposable runner resources and verifies their cleanup; local validation created no cloud resources. No catalog certification or package release is claimed.
