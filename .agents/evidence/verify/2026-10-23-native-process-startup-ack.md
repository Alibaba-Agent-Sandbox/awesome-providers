# Require native process startup acknowledgment

Result: PARTIAL; local producer regressions pass and updated end-to-end pins require T4.

Issue: https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues/23. The real Docker run https://github.com/Alibaba-Agent-Sandbox/awesome-providers/actions/runs/39941973393 passed source/profile build, owned application launch/readiness, CLI application named commands and Python existing-application commands. Python prepared-image startup timed out because the CLI/Python bridge lost its native startup identifier. Cleanup verified no remaining sandboxes.

The OpenSandbox producer also had a fallback that fabricated a random process identifier when no native execd init identifier arrived. That fallback is removed. Missing, empty or non-init acknowledgments now fail without replay, release the stream, and do not subscribe output handling. Native init identifiers remain unchanged. The bilingual provider README documents this failure boundary.

Executed on the final scoped producer source with Node 22:

- `node opensandbox/tests/run.mjs unit mock`: PASS, 57 tests, 0 skip. Includes three regressions for missing stream init, stdout without init, and an empty init identifier; each asserts one native submission, released stream and no output subscription.
- `node --check opensandbox/src/exec.mjs` and `git diff --check`: PASS.

Python bridge correction: https://github.com/Alibaba-Agent-Sandbox/python-sdk/commit/899ca0de60326fed9774e399c95e61ca3f032abf preserves integer/opaque IDs and timestamps. The corresponding CLI acknowledgment fix is a separate owner change. The workflow must pin both reviewed runtime commits and rerun source application plus Python prepared-image launch, invocation and cleanup. Local mocks do not establish complete native acceptance.

Final rerun pins: CLI b11af7cead34780e1b7e6c6de9afc4019d2eb9df (real native acknowledgment and identifier validation), Python SDK 3aa5e5ae6bd9c843f62c6689e549437f460b382d (899 runtime plus synchronized wire fixture), template bf410ec1b82febe0f668327d119683ebfdf69f9c. Base SDK installation remains unchanged. Missing-init regressions also verify that the response-body reader lock is released. Workflow YAML parsing PASS.
