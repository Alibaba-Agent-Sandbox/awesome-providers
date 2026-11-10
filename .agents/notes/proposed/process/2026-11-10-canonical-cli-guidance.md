# Canonical CLI consumer guidance

Status: Proposed; local documentation update, coordinated merge pending.
Request: https://github.com/Alibaba-Agent-Sandbox/agent-sandbox/issues/244

## Problem

The CLI's unified source command surface requires consumers to distinguish source
preparation, named deployment lifecycle and runtime client calls.

## Decision

Current provider READMEs, contributor guidance and skills now use deploy --template-id for native resources, deploy SOURCE --name for source applications, root delete, config and provider run. Provider implementation, protocol, metadata, maturity and historical acceptance evidence remain unchanged.

## API Design

No public API or dependency changes. Current-source commands are documented separately
from fixed historical releases. Existing credential audiences and runtime limitations
remain in place.

## Alternatives considered

Adding compatibility aliases in each consumer would duplicate CLI ownership. Treating
the Node HTTP client as a cloud lifecycle client or changing Provider features for a
documentation update would expand scope without evidence.

## Dependencies

The corresponding CLI change must land before users rely on current-source command
examples. Source merge does not imply a newly published CLI or SDK package.

## Test Strategy

Inspect actual registered CLI commands, verify changed Markdown links, review the
bilingual task paths and run any owning repository checks applicable to this scope.

## Acceptance criteria

Current examples resolve to existing CLI commands and accurately retain the runtime
package's responsibility. Historical evidence is unchanged; no new backend acceptance
or maturity claim is introduced.

See [verification](../../../evidence/verify/2026-11-10-canonical-cli-guidance.md).

## Mainline reconciliation

Merge fixed main `c5e2b6250a023312f999bf2cc1112bab81121b25` to retain the independently merged preview/community announcement and QR replacement. Both lines of documentation coexist without conflicts. No implementation or compatibility change is added; verification is recorded in the separate mainline-merge evidence.
