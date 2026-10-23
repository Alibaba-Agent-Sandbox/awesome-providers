# Explicit template workflows
Status: proposed

## Problem

Provider-wide interpreter metadata and implicit Dockerfile/entrypoint adaptation hid which consumer operation was actually implemented.

## Decision

Declare operation contract 1, exact CLI/Python operations and supported workflow inputs/startup modes in each plugin manifest and runtime handshake. Reject unsupported contexts/callbacks before I/O. Remove implicit FROM, USER and COPY rewriting. Pass explicitly selected Dockerfile profiles unchanged. Journal intent before image/template creation and report owned retained resources.

## API Design

Application HTTP, exec and interpreter paths are distinct. Only the selected workflow can require an interpreter operation. Unknown runtime prerequisites do not mean the platform lacks an API. Beta maturity and current workflow evidence remain independent. No old schema or coarse code compatibility aliases are accepted.

## Alternatives considered

Keeping broad code capability gates or silently replacing platform build instructions would continue to misrepresent application support and source identity.

## Dependencies

- [Owner Issue](https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues/23)
- [Shared contract](https://github.com/Alibaba-Agent-Sandbox/python-sdk/blob/5f7631cfc02e6e67bdf7a7325ef39dec112f812d/contracts/workflow-v1.json)
- [CLI workflow implementation](https://github.com/Alibaba-Agent-Sandbox/agent-sandbox) (consumer dependency; final reviewed revision must be pinned before native integration acceptance).

## Test Strategy

Validate strict manifests and operation boundaries, unchanged source build recipes, explicit profile selection and conservative historical evidence handling. Native workflow verification must use exact implementation revisions and independent owned-resource cleanup.

## Acceptance criteria

Current manifests and consumers agree on the new contract; relevant regression and current-head CI gates pass; native acceptance remains explicitly incomplete until exercised. Merge only after required review and checks.

Native exec startup requires the provider's actual acknowledgment identifier. Missing native init is a non-replayed failure; no synthetic process ID may make startup appear acknowledged. See [producer regression evidence](../../../evidence/verify/2026-10-23-native-process-startup-ack.md).

Exact Docker application workflow acceptance is recorded in [the native workflow result](../../../evidence/verify/2026-10-23-opensandbox-workflow-native-acceptance.md); it does not certify other provider/input/interpreter combinations.
