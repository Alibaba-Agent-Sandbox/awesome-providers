# Verification: accepted OpenSandbox Docker scope with current hosts

- Date: 2026-10-23
- Result: PASS for the accepted Docker scope
- Provider tested: 37f0ef1dde1bee3b13e3fcb757a8f96464779336; package/manifest/handshake 0.4.1.
- Merged implementation: https://github.com/Alibaba-Agent-Sandbox/awesome-providers/pull/22 (`666ddaf5b0ed2962ceff031e9207488c75e0d718`).
- Native workflow: https://github.com/Alibaba-Agent-Sandbox/awesome-providers/actions/runs/39909556021 ; every step, including always-run cleanup, completed successfully.
- CLI: reviewed released 0.4.9 source `1aad4e8ddfa0aa7840d61abcfbd3de264b54da58`.
- SDK client/server source pair: `64c0e5cd6ea9e849997f8d83b404f2f34a58b459`.

## Actual environment and execution

Disposable hosted Ubuntu Docker runner, Node 22, Python 3.12, OpenSandbox server 1.1.1, matching release-1.1.1 execd pinned to `sha256:cda2bc35409bbf57561599b316cafb899598f7dce671332e7ceda14eb1cfeded`. Docker networking, stock images, egress sidecar disabled and local test authentication; no cloud credentials.

1. Locked CLI install/build and matching SDK source install: PASS.
2. Official SDK project parser/actual host staging and isolated-HOME fixture: PASS.
3. Actual plugin unit/live, installed provider contract kit and environment precedence stages: PASS.
4. Streamed Python SDK contract/scenario suite: **23 passed**.
5. Real CLI lifecycle/commands/files/install/contract suite: **15 passed**, no failed/skipped scenarios.
6. Native project Docker build, local registry push, launch from the immutable returned image, service readiness and separate execution probe: PASS.
7. Always-run teardown stopped test services, removed the disposable registry and asserted no owned sandbox containers remained: PASS.

The actual completed job log was inspected for the SDK/CLI counts and every step conclusion. Prior Beta-era captures and restricted-workspace failures are preserved; this is a new current-host receipt, not a relabelled mock or historical run.

## Acceptance decision and limits

The maintainer explicitly accepted the verified Docker scope on 2026-10-23. Provider-owned metadata declares stable; public sites omit a maturity badge for accepted providers and retain Beta badges for other providers. Acceptance does not certify every template/image or imply Kubernetes, egress/network-policy, secure-access or code-interpreter acceptance. Undeclared capabilities still return E8004.

Coordination and final publication: https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues/21 , https://github.com/Alibaba-Agent-Sandbox/website/issues/28 , https://github.com/Alibaba-Agent-Sandbox/registry/issues/25 . Publication is verified separately after site deployment.
