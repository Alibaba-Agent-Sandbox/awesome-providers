# Decision: Verify workflow review corrections with the actual host

Status: proposed

## Problem

The previous OpenSandbox acceptance pins the CLI implementation before the
independent workflow review. That run cannot certify the corrected protocol,
authorization and resource-journal behavior in the new host revision.

## Decision

Update the existing native Docker workflow to the reviewed immutable CLI commit
and the corresponding reviewed template source. Retain the exact previously
verified Python runtime and released server/execd pair. Run the complete existing
integration and its independent cleanup without weakening any check.

## API Design

No provider API, operation declaration, plugin code or runtime configuration
changes. Only CI producer revisions, bilingual test guidance and engineering
records change.

## Alternatives considered

- Reuse the older pass: rejected because its consumer identity differs.
- Claim a localhost unit test certifies Docker: rejected; keep these scopes distinct.
- Change a provider declaration to bypass the host: rejected; fix and test the host.

## Dependencies

- https://github.com/Alibaba-Agent-Sandbox/agent-sandbox/issues/122
- https://github.com/Alibaba-Agent-Sandbox/awesome-templates/pull/198
- https://github.com/Alibaba-Agent-Sandbox/python-sdk/pull/89

## Test Strategy

Run the unchanged plugin T0 suite and the actual Docker T4 workflow with the new
source pins. It must build/push the explicit portable source profile, launch and
invoke through the CLI, connect through Python, launch an independent immutable
prepared image and verify owned cleanup. Static checks and author PASS records
do not confer catalog certification.

## Acceptance criteria

The exact revised host passes ordinary latest-head CI and real OpenSandbox T4,
with successful cleanup. Preserve previous evidence. Record native failure or
missing prerequisites as such. Merge through a normal PR after checks pass.
