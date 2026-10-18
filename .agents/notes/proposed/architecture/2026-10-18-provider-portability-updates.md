# Decision: Own catalog template examples inside each provider

Status: proposed

## Problem

Consumer-generated vendor-specific create examples can drift from adapter template semantics and are not owned with the plugin version.

## Decision

Add display-only catalog.json per provider, a bilingual schema guide and patch-version/index changes. Do not activate pending E2B/Cube factories or change backend runtime behavior.

## API Design

Schema version 1: template_input is template-id/image-uri; template_example is a nonempty bounded string. The file is part of the reproducible provider tree/digest, not runtime dispatch or native test evidence.

## Alternatives considered

Keeping switches in each frontend duplicates technical assumptions. Embedding executable snippets or endpoints in display metadata is unnecessary. Activating unverified factories from metadata would bypass acceptance.

## Dependencies

Registry consumer: https://github.com/Alibaba-Agent-Sandbox/registry. Host lifecycle: https://github.com/Alibaba-Agent-Sandbox/agent-sandbox/blob/c5a6a3c75921cfb4359f1c23041ec847ce63c932/docs/en/design/provider-portability-and-updates.md.

## Test Strategy

Validate JSON schema/manifest/index version consistency and unchanged feature sets; run the documented E2B/OpenSandbox T0 entry points and the CLI reference suites for the other adapters and document missing native backend tests separately.

## Acceptance criteria

Each provider owns its example and patch version; registry consumes it as data; all feature sets and native acceptance gates remain unchanged; links/diff/T0 results are recorded.

## Evidence

[Verification](../../../evidence/verify/2026-10-18-provider-portability-updates.md).

Catalog owner issue: https://github.com/Alibaba-Agent-Sandbox/registry/issues/6.
