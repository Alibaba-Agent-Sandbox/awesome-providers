# Decision: Integrate provider image adapters without dropping CI coverage
Status: proposed

## Problem

E2B and CubeSandbox adapter changes overlap in the CI workflow and catalog. Merging
one job over the other would silently remove coverage. Earlier installed-host tests
were pending independently of each plugin's local protocol tests.

## Decision

Retain three independent CI jobs for E2B, CubeSandbox and OpenSandbox. Preserve both
image adapter implementations and conservative capability metadata. Verify the
installed CLI host with both adapters before merging the combined source.

## API Design

No new capability declaration or native cloud certification. E2B uses the official
SDK 2.55.0 supplied by the host; CubeSandbox uses its own native API. Existing
sandbox methods and plugin installation consent remain unchanged.

## Alternatives considered

Keeping just the newer CI job loses regression coverage. Enabling undeclared
capabilities from successful mocks would overstate native backend acceptance.

## Dependencies

Integrates https://github.com/Alibaba-Agent-Sandbox/awesome-providers/pull/5 into
https://github.com/Alibaba-Agent-Sandbox/awesome-providers/pull/10. Host source:
https://github.com/Alibaba-Agent-Sandbox/agent-sandbox/pull/42.

## Test Strategy

Run all three T0 suites and both T1 installed-host checks. Read every actual job
for the resulting PR head. Native backend T4 requires an available authorized
backend; none is started in this PR, and no native backend receipt is claimed.

## Acceptance criteria

All three T0 jobs remain and pass. Both T1 flows install the actual plugin into
a temporary CLI home, dispatch through the built host and clean up their fixtures.
Required remote checks/reviews must pass before merge.

## Evidence

[Verification](../../../evidence/verify/2026-10-18-integrated-provider-ci.md).
