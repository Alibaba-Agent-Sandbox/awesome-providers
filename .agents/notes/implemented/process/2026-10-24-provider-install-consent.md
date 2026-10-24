# Decision: Accurate provider installation and consumer guidance

Status: implemented

## Problem

Active bilingual OpenSandbox and authoring guides promise that installation never runs plugin code. They also retain ambiguous Python entry points and three nonexistent CLI subcommands.

## Decision

Describe static inspection before consent separately from default handshake verification after consent. Keep supported exec/rest/node kinds. Describe Node adapters for backend APIs or vendor SDKs, use the explicit ProviderSandbox entry point, and map streaming, TTL and endpoint access to actual CLI/SDK interfaces. Link the existing installation/trust guide. Keep protocol, manifest, version and runtime files unchanged.

## API Design

N/A — documentation correction; no API or installation behavior changes.

## Alternatives considered

Removing exec would falsely retire a supported runtime. Keeping the unconditional no-execution promise misdescribes both installers. Adding new CLI commands to match outdated prose is outside this correction.

## Dependencies

[CLI installation guide](https://github.com/Alibaba-Agent-Sandbox/agent-sandbox/blob/main/docs/en/guide/providers.md), [Python provider installer](https://github.com/Alibaba-Agent-Sandbox/python-sdk/blob/main/client-sdk/src/agent_sandbox/providers/__main__.py), and [Issue 32](https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues/32).

## Test Strategy

Read both manifest parsers, loaders and verification callbacks; compare published CLI 0.4.16 actual command dispatch and Python API signatures; validate bilingual links and records; run required T0 and PR CI. No new backend or matrix run for prose.

## Acceptance criteria

Both languages state the same consent boundary, preserve actual runtime kinds, and name existing consumer interfaces. Required checks and review pass before merge.

## Evidence

[Verification](../../../evidence/verify/2026-10-24-provider-install-consent.md).
