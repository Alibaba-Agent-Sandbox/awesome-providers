# OpenSandbox explicit workflow native acceptance

Result: PASS (the exact Docker application workflow scopes below).

Issue: https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues/23. PR: https://github.com/Alibaba-Agent-Sandbox/awesome-providers/pull/25.

## Independent remote execution

Run: https://github.com/Alibaba-Agent-Sandbox/awesome-providers/actions/runs/39944389940 ; job 120383341733. The GitHub run/jobs APIs report completed SUCCESS. Actual downloaded step logs were inspected, including native project execution and final cleanup. This is a real Ubuntu Docker/OpenSandbox run, not a mock or authorization-only controller result. The artifacts API returned zero uploads; this record summarizes the job/log evidence and is not a fabricated uploaded receipt.

Exact reviewed source pins:

- Provider and test harness: `99c2d85f1e22f6cd747247bbb3339a0cecc72e5f`.
- CLI: `b11af7cead34780e1b7e6c6de9afc4019d2eb9df`.
- Python SDK: `3aa5e5ae6bd9c843f62c6689e549437f460b382d` (base install, including core YAML dependency and native startup metadata).
- Template: `bf410ec1b82febe0f668327d119683ebfdf69f9c`, exact `python-hello` with explicit `portable` profile and immutable base image.
- Backend: Docker, OpenSandbox server 1.1.1, execd `opensandbox/execd@sha256:cda2bc35409bbf57561599b316cafb899598f7dce671332e7ceda14eb1cfeded`.

## Observed scopes

All setup and execution steps passed: pinned official SDK with actual CLI staging, isolated-home harness, real Docker backend startup, direct plugin live execution, installed contract kit, environment precedence, Python SDK scenarios and CLI lifecycle/commands/files.

The final native project test independently asserted these paths:

1. CLI `application` source workflow, explicit `portable` profile: exact source snapshot -> Docker build -> local registry push -> returned immutable image digest -> OpenSandbox create -> exec startup -> application readiness -> named HTTP command `hello` returning `Hello, OpenSandbox!`.
2. Python connects to that existing CLI-owned sandbox, resolves the real application endpoint using `application_client`, supplies its explicit application token, asserts the same hello result and closes its client without taking ownership of the CLI sandbox.
3. Python `application-image` workflow consumes the same immutable prepared image. It separately creates its owned sandbox, receives the native process acknowledgment, starts and checks the service, verifies protocol, invokes hello and closes its WorkflowSession. A fresh provider inventory excludes that owned ID.
4. The CLI-owned sandbox is killed and independently absent from a fresh CLI JSON inventory. The workflow's final cleanup step stops the backend, removes the test registry and asserts no remaining sandbox containers. Cleanup step SUCCESS.

Actual step-13 fixed log markers at 11:14 UTC confirm source/profile preparation/readiness, CLI application HTTP and the complete Python prepared-image workflow with owned cleanup. No application tokens, raw private resource identifiers or cloud credentials are copied into this record.

## Boundaries

Python source preparation remains explicitly unsupported; the Python result above is a distinct prepared-image workflow, not certification of Python source preparation. Unified `code.*` interpreter operations remain unsupported by this OpenSandbox adapter and are tested as explicit E8004; application-provided named commands do not depend on an injected interpreter. Kubernetes, secure gateway access, network policy and other providers are not certified by this Docker run. The separate historical Express canonical cloud gate remains BLOCKED and is not represented as a cloud pass.

The earlier failed runs remain immutable evidence: SDK fixture mismatch, YAML scalar ambiguity, empty JSON list, missing base YAML dependency and lost native startup acknowledgment were fixed with owner regressions before this pass. Local producer suite: 57 PASS, 0 skip. Same-head ordinary provider CI run 39944389985 also completed SUCCESS.
