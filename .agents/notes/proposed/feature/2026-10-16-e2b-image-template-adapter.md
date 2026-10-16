# Decision: E2B image template deployment through the official SDK

Status: proposed

## Problem

E2B currently creates sandboxes from existing template identifiers. The catalog plugin has
no image template build adapter, and the CLI template pipeline is specific to Express.
Enabling the coarse template build feature would route unsupported operations incorrectly.
The earlier design also references a retired E2B metadata creation endpoint.

## Decision

Implement an image-only adapter using the official E2B Template SDK, injected by the host.
Keep its manifest capability undeclared until host dispatch is reviewed. Do not install
packages at plugin load or fall back to Express registry/cloud credentials. Reject
unsupported inputs before submission. Discard raw SDK logs and error text to protect
credentials. Cancellation stops waiting; a remote build already submitted may remain.

## API Design

An asynchronous `buildTemplates(ctx)` returns an adapter with asynchronous `deploy(input)`.
Input: `source: {kind: "image", image}`, `name`, optional `spec` containing integer `cpu`,
integer `memory` (MB), `start_cmd`, `ready_cmd`; optional `registry: {username, password}`,
`timeout` in seconds, and `signal`. Start requires ready. Result after SDK success:
`{template_id, build_id, status: "ready", ref}`. The dedicated host capability is
`templates.deploy`; read/delete/build operations are not implied.

## Alternatives considered

- Reuse retired REST create-template paths: rejected; the current official SDK uses v3.
- Send E2B deployment through Express FC/ACR: rejected; those APIs and keys are unrelated.
- Add local Dockerfile/file uploads immediately: deferred until a separately validated contract.

## Dependencies

Host injection of official `e2b@2.55.0` on Node 22+, dedicated feature gating,
and reviewed provider dispatch in a new host; no released-version support is claimed.
The SDK's top-level Node 20 engine claim conflicts with its statically imported
`@e2b/dockerfile-utils@0.1.1`, which requires Node 22+. Image deployment therefore does
not claim Node 20 support. Authorized E2B credentials are required for real-backend
verification. Track [issue #4](https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues/4).

## Test Strategy

T0 input validation, credential isolation, malformed SDK response, cancellation, error
privacy and factory gating. A separate actual-SDK test performs v3 create, v2 trigger and
ready polling against loopback HTTP. CI installs the pinned SDK with lifecycle scripts
disabled and runs the same checks. Existing OpenSandbox T0 is also inspected separately.

## Acceptance criteria

- T0 proves normalized input and actual official SDK HTTP behavior against loopback.
- No capability or real-cloud claim exceeds implemented and verified behavior.
- Host dispatch is reviewed before enabling the provider's manifest capability.
- Missing E2B credentials remain an explicit live-test skip.

## Evidence

See [verification](../../../evidence/verify/2026-10-16-e2b-image-template-adapter.md).
