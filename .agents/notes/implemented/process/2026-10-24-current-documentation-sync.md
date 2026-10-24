# Synchronize current documentation and engineering records

Status: implemented

## Problem

User-facing guidance and the engineering index still foreground older checkpoints after the October 24 delivery. Some merged decisions remain proposed; historical evidence must remain immutable.

## Decision

Synchronize authoring and the agent skill with actual Node-engine versus direct exec/rest hosting and installation consent. Expose later direct/proxy and public-template evidence, public CLI 0.4.17/Python 0.3.1a5 recommendations, and the unchanged compatibility floors. Move the merged October 24 simplification decision into implemented and repair its current index link. Add a concise changelog entry. Retain all dated evidence bytes, original tested versions and unchanged runtime inputs. Older proposed decisions are not promoted without reviewing their own acceptance criteria.

## API Design

Documentation only. No runtime, manifest, catalog, compatibility floor or package version changes; no new support-state taxonomy.

## Alternatives considered

Rewriting old receipts would destroy provenance. Copying the complete cross-repository report would duplicate ownership. Repeating cloud runs for navigation and prose changes would add cost without exercising changed runtime behavior.

## Dependencies

Baseline: `998a9d6a438f5c9b1f149ace26608b4132222b1c`. Requested by the maintainer as synchronization of recent changes into each repository's documentation and `.agents`.

- [Merged PR #30](https://github.com/Alibaba-Agent-Sandbox/awesome-providers/pull/30)

- [CLI 0.4.17 delivery](https://github.com/Alibaba-Agent-Sandbox/agent-sandbox/pull/149)
- [Python 0.3.1a5 delivery](https://github.com/Alibaba-Agent-Sandbox/python-sdk/pull/103)

## Test Strategy

Check documentation links and changed record links, bilingual scope and public API examples; verify moved notes match their directories and original evidence files are unchanged. Run owning-repository applicable checks and require current-head CI before merge. No new cloud claim or cloud resources.

## Acceptance criteria

Current docs and the engineering index lead to recent delivered behavior and exact verification; historical receipts and runtime contracts are unchanged. Normal PR review and applicable CI gate publication.

## Evidence

[Documentation verification](../../../evidence/verify/2026-10-24-current-documentation-sync.md).
