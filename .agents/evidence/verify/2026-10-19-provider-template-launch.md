# Verification: provider-owned template launch

Result: PARTIAL

## Scope

Task branch `feat/provider-template-launch-20261019`; owner Issue https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues/16. Tested the scoped source, adapter, documentation and catalog changes in this PR, with Node 22 and locked dependencies where applicable.

## Executed checks

T0: E2B 14, Cube 10, OpenSandbox 51 and generic project 5 tests passed. Actual pinned E2B SDK parser with actual host staging passed (loopback, not native E2B). Native OpenSandbox T4 is mandatory in the Docker workflow. Independent E2B/Cube/cluster credentials are unavailable and formal native acceptance stays deferred by the maintainer; no Stable promotion.

## Delivery and limits

PR, hosted CI, native OpenSandbox Docker and public deployment receipts are pending at this checkpoint. No loopback result is a native E2B/Cube/cluster result. Those providers remain Beta. Express is the sole Stable provider. A released npm version containing the new command has not been published by this task.

## Cleanup

Local staging fixtures were removed by their tests. No Registry build or visitor webpage receives cloud credentials or creates visitor resources. Cloud and Docker cleanup results will be recorded with their respective real-component runs. No credentials or private resource identifiers are included here.

## Initial hosted native checkpoint

Native workflow 39268881973 passed the actual official SDK project parser, direct installed plugin/contract/environment checks, 23 Python SDK scenarios and 15 CLI lifecycle scenarios. The new project launch returned a real sandbox, but its probe fixture supplied shell arguments as separate CLI tokens and cleanup omitted `--yes`; cleanup waited for input and obscured the probe failure. The isolated runner's final cleanup still passed and removed its server, registry and sandbox containers. This is recorded as FAIL, not native project acceptance. The fixture now sends one quoted command and explicit noninteractive cleanup; the full T4 run is required again.

## Successful hosted native checkpoint

PASS: workflow 39269940434 on reviewed head `3e13281b71ac4c0c36e985b9b0fdb6ffc1056104`. The actual official SDK parser/host staging ran without skipping, real OpenSandbox SDK scenarios passed 23/23 and CLI lifecycle scenarios 15/15. The new project fixture successfully built through Docker, pushed to its disposable local registry, launched from the exact returned immutable image, started the project HTTP server, passed readiness and a separate CLI exec probe, then killed its owned sandbox. The always-run cleanup removed the native server, local registry and test containers and confirmed no sandbox containers remained. No cloud credentials were used. This Docker subset remains Beta and does not claim E2B/Cube/Kubernetes/native code-interpreter acceptance.

The final workflow now pins merged CLI main `874ad70f5ca8e5d167a8d90310071faeea027d0c` from https://github.com/Alibaba-Agent-Sandbox/agent-sandbox/pull/71 instead of a feature-branch commit. The final current-head T0/T4 run is required before merging this provider PR. Added relative Markdown links were checked and all resolved. The root AI skill now documents preparation ownership and separate plugin/bundled update paths.
