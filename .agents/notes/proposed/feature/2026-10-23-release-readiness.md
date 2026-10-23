# Decision: Repair provider release lifecycle and onboarding

Status: proposed

## Problem

OpenSandbox could return a create error after obtaining a running sandbox ID without deleting the new resource when its final detail read failed. Independent provider directories omitted the repository license. Catalog contribution and Skill entry points had mismatched names, source-index instructions and consumer claims.

## Decision

Keep the final detail read inside the create cleanup boundary. Cleanup ignores the cancelled request signal, preserves the original error and reports a failed cleanup with its known sandbox ID without exposing backend error text. Bump the OpenSandbox plugin/handshake/local installer version to0.5.1. Copy the project Apache license into each independently shipped E2B, CubeSandbox and Container package.

Correct the catalog Skill selector and scope, source YAML versus local Python fixture distinction, current CLI/Python consumers, and explicit application/portable-profile launch example. Retain independently scoped maturity and historical evidence. Current upstream main already introduced workflow contracts and corrected part of the earlier architecture review; this patch completes the remaining release-specific fixes.

## API Design

No removal or addition of provider operations. Failed cleanup adds `cleanup: {sandbox_id, status: "failed"}` to RpcError data and emits a recovery warning. Original code/message remain primary. Successful DELETE is not presented as independent absence verification. Node ServerClient is a separate application HTTP interface, not a cloud provider bridge.

## Alternatives considered

A new registry service or general transaction framework is unnecessary. Silently ignoring cleanup failure loses the caller's recovery ID. Claiming code interpreter support to bypass a template gate is incorrect; the current explicit application workflow and portable build profile express the actual path.

## Dependencies

Current CLI workflow-v1/build-profile implementation and awesome-templates python-hello application/portable source. The new path requires separate exact-input acceptance; historical Docker acceptance remains scoped. Registry archives will include the tracked provider licenses on regeneration.

## Test Strategy

Exercise final-read failure, cancellation, failed deletion, already-absent deletion, readiness failure and successful creation using real methods with synthetic transport. Run provider unit/mock/project/official-SDK-loopback suites and current documentation links. Native Docker execution remains a distinct gate.

## Acceptance criteria

- Known newly created sandbox is cleaned when any pre-return step fails.
- Cleanup never uses the caller's aborted signal or masks the primary failure.
- Failed cleanup provides a recovery ID without raw backend details.
- Each independent package contains LICENSE; documented Skill/install/runtime entry points agree.
- Applicable local and native gates pass before release/merge; missing gates remain explicit.

## Evidence

[Verification](../../../evidence/verify/2026-10-23-release-readiness.md).
