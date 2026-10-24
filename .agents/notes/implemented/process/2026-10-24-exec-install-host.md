# Decision: State the actual exec installation host

Status: implemented

## Problem

The active bilingual installation guide incorrectly requires the local Node engine for Python exec providers.

## Decision

Limit the abx/PATH/ABX_BIN engine prerequisite to Node plugins. Explain that the Python host runs an exec manifest command directly. Preserve the explicit ProviderSandbox alias example and every runtime contract.

## API Design

N/A — two translated sentences; no code, manifest or version change.

## Alternatives considered

Removing exec or changing its implementation would contradict the existing loader. Keeping the incorrect prerequisite would confuse Python-only exec users.

## Dependencies

[Issue 34](https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues/34), [Python provider registry](https://github.com/Alibaba-Agent-Sandbox/python-sdk/blob/main/client-sdk/src/agent_sandbox/providers/registry.py).

## Test Strategy

Compare the actual EngineProvider/ExecProvider loader branches, verify document links and required T0/CI. Do not manually repeat a cloud or full-template run for prose.

## Acceptance criteria

Both languages correctly distinguish engine requirements and pass normal review and CI.

## Evidence

[Verification](../../../evidence/verify/2026-10-24-exec-install-host.md).
