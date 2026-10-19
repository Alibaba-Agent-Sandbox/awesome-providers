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
