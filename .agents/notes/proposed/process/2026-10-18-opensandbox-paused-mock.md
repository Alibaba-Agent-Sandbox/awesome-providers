# Decision: Deterministic paused-sandbox mock failure

Status: proposed

## Problem

The paused-sandbox T0 mock destroys its HTTP socket. An intermediary can translate
the reset into HTTP 502 and replace the message, failing the test's transport-specific
assertion even though the plugin returns a retryable EPP failure.

## Decision

Return HTTP 503 with a paused-state message from the loopback mock. Assert the EPP
failure code, retryability, HTTP status and message, then resume and verify command
execution. Keep the existing unreachable-server transport regression.

## API Design

N/A — this decision does not involve API changes. Only the mock and its test change.

## Alternatives considered

Accept either reset or arbitrary gateway text: rejected because it weakens the
paused-state assertion and still depends on intermediary behavior.

## Dependencies

Node 20+ for T0. No cloud account or Docker is required.
[Issue #6](https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues/6).

## Test Strategy

Reproduce the existing failure, then run all OpenSandbox T0 tests. Verify the
resumed sandbox executes successfully and all mock resources close in finally.

## Acceptance criteria

- Paused calls return the asserted retryable failure deterministically.
- Resume restores command execution.
- Full T0 passes with no production transport change.

## Evidence

[Verification](../../../evidence/verify/2026-10-18-opensandbox-paused-mock.md).
