# Decision: Gated native CubeSandbox image-template adapter

Status: proposed

## Problem

The CubeSandbox plugin has no template factory. Its native image endpoint differs
from E2B's SDK v3 build sequence; enabling a coarse template feature would not
provide safe host dispatch or correct provider-specific input conversion.

## Decision

Add an image-only asynchronous template factory using native CubeAPI with explicit
provider origin and optional key. Gate it on the dedicated `templates.deploy` token
and keep that token undeclared until compatible host/schema delivery and acceptance.
Use a pre-pushed image running envd on 49983 with `/health`, a fixed 1G writable
layer, integer CPU cores converted to millicores and integer MiB memory.

Reject unsupported shell startup/readiness specs, non-image sources, unknown fields
and tagged/namespaced aliases before I/O. Do not silently follow CubeAPI's lossy
alias normalization. Disable redirects and automatic submission retries. Bound all
requests/polling with a clearable timer/caller signal and omit raw backend errors.

## API Design

`buildTemplates(ctx).deploy({source: {kind: "image", image}, name,
spec?: {cpu, memory}, registry?: {username, password}, timeout?, signal?})` returns
`{template_id, build_id, status: "ready", ref}` only after polling the exact job.
Names match Cube aliases (1–64 lowercase alphanumeric/hyphen characters; no `tpl-`
or `snap-` prefix). Other shared spec fields are explicitly unsupported here.

The native sequence is `POST /templates` → 202 `{templateID, jobID}` →
`GET /templates/{templateID}/builds/{jobID}/status`. The public status endpoint emits
`building`, `ready` or `error`; internal job constants are not the wire contract.

## Alternatives considered

- Reuse the E2B v3 SDK: rejected because its submission protocol differs.
- Derive shell readiness from arbitrary commands: rejected because CubeAPI exposes
  HTTP probes and cannot preserve that meaning.
- Enable the manifest immediately: rejected because current released host/schema
  compatibility and a real Cube cluster have not been established.

## Dependencies

[Issue #9](https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues/9).
Upstream contract pinned to TencentCloud/CubeSandbox
`e0c1820ac2132df08bd4912e614486717275b956`; see the evidence's immutable source links.
The compatible CLI host is tracked in
[CLI Issue #41](https://github.com/Alibaba-Agent-Sandbox/agent-sandbox/issues/41).
Authorized CubeAPI/KVM infrastructure is needed for live acceptance; no cloud keys
or alternate provider credentials are borrowed.

## Test Strategy

Native source-derived loopback HTTP tests cover exact request units/fields, public
status mapping, failed/malformed jobs, private registry data, optional authentication,
real redirect isolation, input rejection, deadlines and cancellation privacy.
An optional built-host fixture installs a temporary opted-in plugin through CLI
consent and checks dispatch/results. A negative control restores the incorrect
uppercase-only interpretation and must fail the corrected public-protocol tests.

## Acceptance criteria

- T0 passes with no cloud claims or silent field loss.
- Local installed-host dispatch uses only Cube credentials and the native sequence.
- Manifest remains disabled while compatible delivery/live acceptance are pending.
- A real Cube build/create/exec/kill is explicitly unverified until authorized
  infrastructure exists.

## Evidence

[Verification](../../../evidence/verify/2026-10-18-cubesandbox-image-adapter.md).
