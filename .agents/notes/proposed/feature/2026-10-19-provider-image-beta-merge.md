# Decision: Let the E2B adapter request its optional template SDK

Status: proposed

## Problem
The image-host draft loaded an SDK by provider ID. That made adapter requirements implicit host policy and left no explicit lazy request usable by compatible adapters.

## Decision
E2B buildTemplates requests kit.e2b.loadTemplate() only after its deployment gate passes. A fallback to kit.e2b.Template supports earlier constructor kits. Sandbox infrastructure never requests the optional SDK. Version 0.2.3 keeps the public deployment feature undeclared and E2B Beta. The maintainer has explicitly deferred third-party native acceptance; this merge does not claim it.

## API Design
The plugin awaits an optional loadTemplate(): Promise<unknown> shared helper supplied by the host. Adapter-owned createTemplates continues to validate and map authentication, images, resources, readiness, deadlines and native SDK requests. The public node/1 entry and sandbox protocols are unchanged.

## Alternatives considered
An implicit provider-ID dispatch couples host policy to catalog identity. Eager loading penalizes ordinary sandbox use. Removing the constructor fallback unnecessarily breaks compatible older kits. Enabling public deployment without native acceptance overstates support.

## Dependencies
Host helper delivery: https://github.com/Alibaba-Agent-Sandbox/agent-sandbox/pull/42. The host contract lands before this consumer. Tracked defect: https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues/14. Native acceptance remains tracked separately in https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues/4.

## Test Strategy
Run all E2B T0 tests with pinned official e2b 2.55.0 against loopback, verify no loader call at construction or denied opt-in, and exercise a real local install through the built host. These checks establish protocol integration rather than native cloud acceptance.

## Acceptance criteria
Only explicitly opted-in buildTemplates calls the helper. Old constructor kits still work, public manifests remain gated/Beta, independent credentials remain scoped and temporary local stores are removed. Exact-head CI passes before normal PR merge.
