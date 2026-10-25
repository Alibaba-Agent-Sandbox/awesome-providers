# Decision: Verify current whole-template startup in the provider T4 gate

Status: proposed

## Problem

The maintained OpenSandbox guide and live runner use retired workflow selectors
and old source pins. Explicit live selection can silently skip an unavailable
backend. Neither behavior proves the current documented developer journey.

## Decision

Remove old workflow calls and test-only configuration aliases. Use one whole
CLI template launch and the current Python prepared-reference launcher. Keep all
three default/portable/server-proxy scenarios, independent Node HTTP calls and
owned cleanup. Install public host SDK a2 and verify actual guest server a2.
Without live opt-in skip; with explicit opt-in require a reachable configured
backend. Preserve historical evidence and do not change provider implementation,
capability declarations, authentication behavior or package versions.

## API Design

Use `launch_template(reference=...)` without workflow_id and public
`ProviderSandbox`. The CLI receipt supplies declared services, not a workflow ID.
No new public interface, compatibility alias or launch mode.

## Alternatives considered

Keeping old pinned passing tests would obscure current behavior. Dropping proxy,
portable or Python/Node checks would reduce existing coverage. Introducing a new
runner is unnecessary; update the existing gate.

## Dependencies

- https://github.com/Alibaba-Agent-Sandbox/agent-sandbox/pull/170
- https://github.com/Alibaba-Agent-Sandbox/awesome-templates/pull/222
- https://github.com/Alibaba-Agent-Sandbox/python-sdk/releases/tag/v0.4.0a2
- https://github.com/Alibaba-Agent-Sandbox/nodejs-sdk/pull/16

## Test Strategy

Run existing provider T0 and preparation tests, actual embedded Python syntax and
public imports, explicit live-gate failure regressions, then the existing real
Docker T4 workflow on exact reviewed source candidates. Actual public release
installation remains a separate check, never inferred from source builds.

## Acceptance criteria

No maintained old workflow arguments remain. Required T0/T4 gates pass with
actual startup, HTTP calls and independent cleanup. Normal review and merge
complete after shared dependencies. Do not describe a candidate as public release.

## Evidence

[Verification](../../../evidence/verify/2026-10-25-current-opensandbox-journey.md).

Issue: https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues/39
