# Decision: Index recent changes to provider documentation and native operations
Status: proposed

## Problem

Recent implementation, user-experience changes and delivery status are spread across
owner records, pull requests and workspace reports. The user requested that recent
changes be retained under each owning repository's `.agents/` and pushed.

## Decision

Keep this dated index in awesome-providers; link existing canonical decisions and immutable
verification instead of copying their reports or rewriting historical acceptance.
This index adds no product behavior and does not change any older ADR's lifecycle.

### Owner changes and canonical records

The candidate aligns provider guides, contribution instructions and skills with unified deployment and provider run native operations. Implementations, protocol manifests, catalog identities and qualification remain unchanged. Existing provider-specific capabilities retain their owning implementation.

- [Canonical CLI consumer guidance](../../../notes/proposed/process/2026-11-10-canonical-cli-guidance.md).
- [Documentation and existing T0 verification](../../../evidence/verify/2026-11-10-canonical-cli-guidance.md).
- [Provider installation runtime guidance](../../../notes/proposed/process/2026-11-05-provider-installation-runtime.md).

### Mainline and candidate boundary

- Mainline observed: `c5e2b6250a023312f999bf2cc1112bab81121b25`.
- Candidate/source observed before this records commit: `69c00068bc919175e06a2c40fb03e6f051db0c4c`.
- [awesome-providers PR #49](https://github.com/Alibaba-Agent-Sandbox/awesome-providers/pull/49), OPEN and Draft at the recorded query; not merged.
- The unified source CLI is different from published CLI 0.5.10. This task does
  not issue npm/PyPI releases, deploy sites or certify changed templates.

Recent mainline changes, inspected from the refreshed Git history:

| Date | Commit | Change |
| --- | --- | --- |
| 2026-11-10 | [c5e2b6250a02](https://github.com/Alibaba-Agent-Sandbox/awesome-providers/commit/c5e2b6250a023312f999bf2cc1112bab81121b25) | docs: replace community QR image and join link (#48) |
| 2026-11-10 | [4a71404e8b34](https://github.com/Alibaba-Agent-Sandbox/awesome-providers/commit/4a71404e8b34560b2b0d51f4a6b6f139db3acaad) | docs: announce preview release schedule and developer community (#47) |

### Remaining delivery limits

The coordinated CLI must be delivered before its commands are advertised as released. Existing T0 and OpenSandbox integration results do not establish every Provider on the new CLI. No provider package is released by this task.

## API Design

N/A — this decision does not involve API changes. Existing runtime, credential,
source identity and resource ownership contracts remain with their original owners.

## Alternatives considered

- A workspace-only summary cannot travel with an independent checkout.
- Copying all cross-repository reports duplicates authority and may expose private logs.
- Marking all proposed records implemented would confuse source work with accepted delivery.
- Combining unrelated local changes or permission-only differences in this commit
  would conceal the actual records scope.

## Dependencies

Existing owner records and GitHub PR/commit state. Coordinated implementation is
tracked in [CLI Issue #244](https://github.com/Alibaba-Agent-Sandbox/agent-sandbox/issues/244).
Each repository retains its own branch, record, verification and push.

## Test Strategy

Check the new record structure, relative links, pinned Git source revisions and
scoped diff; run the owner's applicable documentation/health checks. Query PR/CI
state separately from local checks. Do not run cloud tests solely to validate prose.

## Acceptance criteria

- Recent owner work is reachable from `.agents/README.md` with dated source references.
- Merged, Draft, failed, unrun and planned work remain distinguishable.
- Existing historical evidence and unrelated work remain intact.
- Documentation checks and remaining gates are recorded; scoped commits are pushed
  to task branches and remote branch hashes are independently compared.

## Evidence

- [Records verification](../../../evidence/verify/2026-11-10-recent-change-index.md).
