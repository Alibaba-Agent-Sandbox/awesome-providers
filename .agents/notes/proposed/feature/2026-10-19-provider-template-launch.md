# Decision: Own project preparation in each catalog adapter
Status: proposed

## Problem

Catalog visitors are asked to supply provider template IDs or manually publish an image before trying source templates. References and build policies differ by backend.

## Decision

E2B uses the official SDK Dockerfile parser, Cube builds/pushes an image then registers it through its native API, OpenSandbox returns an immutable image reference, and container edition clones a configured base SandboxSet. Provider-specific authentication, API mapping, polling and cluster policy remain in the adapter. All four remain Beta.

## API Design

Declare templates.build and implement prepareProject through the node/1 template manager. Catalog metadata schema 3 adds project_preparation. Standalone templates.deploy remains gated. Generic host primitives contain no provider dispatch.

## Alternatives considered

- Keep manual IDs as the primary path: this leaves the requested first-use workflow incomplete.
- Dispatch on known provider names in core or Registry: this couples consumers to backend policy.
- Claim capability parity or promote all providers: references cannot add missing PTY/code support and native acceptance is independent.

## Dependencies

Tracked by https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues/16. Cross-repository delivery depends on https://github.com/Alibaba-Agent-Sandbox/agent-sandbox/issues/69, https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues/16, https://github.com/Alibaba-Agent-Sandbox/registry/issues/13 and https://github.com/Alibaba-Agent-Sandbox/awesome-templates/issues/118. The published CLI 0.4.0 predates launch; until a new release, users must build the reviewed source as documented.

## Test Strategy

T0: E2B 14, Cube 10, OpenSandbox 51 and generic project 5 tests passed. Actual pinned E2B SDK parser with actual host staging passed (loopback, not native E2B). Native OpenSandbox T4 is mandatory in the Docker workflow. Independent E2B/Cube/cluster credentials are unavailable and formal native acceptance stays deferred by the maintainer; no Stable promotion.

## Acceptance criteria

- Selecting source does not require manually copying a backend ID when preparation is supported.
- Provider policy remains with its owner; unsupported capabilities fail before resources are prepared.
- Documentation lists one-time credentials/tool/image prerequisites and artifact costs/cleanup.
- Required CI passes on the current PR head; owner PRs are merged in dependency order.
- Registry deployment ingests merged revisions and production readback verifies the published result.

## Evidence

See [verification](../../../evidence/verify/2026-10-19-provider-template-launch.md). Proposal status is retained until acceptance gates have actually passed.
