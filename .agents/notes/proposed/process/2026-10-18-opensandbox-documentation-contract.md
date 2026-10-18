# Decision: Align the OpenSandbox catalog documentation with its manifest

Status: proposed

## Problem

The catalog README lists undeclared environment aliases, claims Express credential
inheritance despite an empty inheritance set, and marks the declared `sessions`
feature unsupported. The provider's primary English and Chinese READMEs already
describe the correct aliases and detached-command behavior.

## Decision

Correct both language sections of `opensandbox/docs/README.md` to match the manifest,
configuration parser and primary READMEs. Explain canonical provider-scoped names,
declared native aliases, host configuration delivery and the limited detached-command
meaning of `sessions`. Link the full field tables instead of duplicating them.

## API Design

N/A — this decision does not involve API changes.

## Alternatives considered

Add the stale aliases or inherit Express credentials: rejected because this would
change the authentication contract solely to match stale prose.

## Dependencies

[Issue #3](https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues/3).
Existing manifest aliases and host canonical-name resolution remain authoritative.

## Test Strategy

Compare both language sections with parsed manifest fields, provider FEATURES and
configuration parser. Resolve local Markdown links and check the diff. The existing
detached-command T0 regression covers the documented behavior; this prose change
does not require cloud resources.

## Acceptance criteria

- Both language sections match declared aliases and empty core inheritance.
- `sessions` is documented as detached commands with the host limitation visible.
- Unsupported stateful shell support is not implied.

## Evidence

[Verification](../../../evidence/verify/2026-10-18-opensandbox-documentation-contract.md).
