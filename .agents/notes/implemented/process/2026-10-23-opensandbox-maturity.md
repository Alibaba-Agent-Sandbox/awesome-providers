# Decision: Accept the verified OpenSandbox Docker scope

Status: implemented

## Problem

Provider metadata and active documentation still mark OpenSandbox Beta despite recorded native Docker CLI/SDK/project-launch acceptance and the maintainer’s explicit promotion request.

## Decision

Set provider-owned OpenSandbox catalog/index maturity to stable. Accept only the documented server 1.1.1 and pinned execd Docker scope; keep Kubernetes, network policies, secure access, code interpreter and per-template coverage independent. Refresh native workflow pins to reviewed CLI 0.4.9 and current SDK source. Align the handshake/package identity with manifest 0.4.1. Remove obsolete only-Express statements from other plugin documentation and bump their changed package patch versions without promoting them. Historical Beta decisions and test captures remain immutable.

Implementation is prepared locally. Required current-head CI and public delivery are pending at this capture; this note does not establish publication or a passed native run.

## API Design

No backend operation or capability changes. Catalog stable/beta and provider IDs are unchanged; OpenSandbox package 0.4.1, other documentation packages 0.3.1.

## Alternatives considered

Keep blanket Beta text or hide every status: this would discard the maintainer’s accepted scope or obscure the remaining Beta providers. Promoting untested backends or treating provider acceptance as per-template coverage would overstate evidence.

## Dependencies

Existing native receipts, T0 tests and hosted Docker T4. CLI 1aad4e8ddfa0aa7840d61abcfbd3de264b54da58; SDK 64c0e5cd6ea9e849997f8d83b404f2f34a58b459.

Issue: https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues/21

## Test Strategy

OpenSandbox T0 and handshake identity; project tests; required full native T4 with actual current host/SDK, project build/push/launch/probe and always-run container cleanup.

## Acceptance criteria

Only OpenSandbox gains stable metadata; fresh native checks pass, package/index versions agree and documented exclusions remain explicit.

## Evidence

[Verification](../../../evidence/verify/2026-10-23-opensandbox-maturity.md).
