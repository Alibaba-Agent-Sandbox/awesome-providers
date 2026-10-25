# Decision: Verify OpenSandbox against the published patch consumers

Status: proposed

## Problem

Current installation recommendations and the existing OpenSandbox gate still
select the previously verified .3/a3 inputs after CLI .5 and SDK a6 publication.
A host-package update does not prove the actual guest uses the same runtime.

## Decision

Select immutable CLI .5 source and official PyPI SDK a6 with its matching server.
Use the reviewed actual merged template source whose default/portable python-hello recipes
actually install public server a6. Keep the explicit actual-guest version assertion.
Update the current bilingual installation recommendation and catalog Skill entry; preserve older
receipts and all existing default/portable/server-proxy/consumer/auth/cleanup gates.

## API Design

No plugin runtime, capability, package version, host interface or Node SDK pin
change. Existing source preparation and the Python prepared-reference launcher
remain the same; no aliases, harness sleep or new selectors are introduced.

## Alternatives considered

Mixing host a6 with an old guest recipe while asserting a6 would knowingly fail.
Dropping the guest assertion or proxy/portable checks would reduce existing scope.
A separate acceptance runner is unnecessary; update the established gate.

## Dependencies

- https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues/41
- https://github.com/Alibaba-Agent-Sandbox/agent-sandbox/releases/tag/v0.5.5
- https://github.com/Alibaba-Agent-Sandbox/python-sdk/releases/tag/v0.4.0a6
- https://github.com/Alibaba-Agent-Sandbox/awesome-templates/pull/225

## Test Strategy

Wait for the exact reviewed, normally merged a6 template dependency before
pushing the T4-triggering change. A candidate readback checks recipe bytes only;
the permanent workflow uses actual merged history, not a deletable PR branch. Read both recipe bytes independently. Run existing scoped T0/live-gate
regressions and then the real Docker T4. Record exact input revisions, actual
public host/guest package identity, all consumers and independent final cleanup.

## Acceptance criteria

Exact public consumer pins and reviewed template recipes are used. Existing T0
and full real Docker T4 pass without weaker assertions; current-head CI, independent
review and normal merge complete. Source-built CLI testing is not called a fresh
public CLI install or whole-catalog/cloud/PTY acceptance. Previous failures and
passing runs retain their original input scope.

[Verification](../../../evidence/verify/2026-10-25-public-patch-opensandbox.md).
