# Template usage simplification

Status: proposed

## Problem

Current guidance mixes obsolete setup, adapter limitations and dated test outcomes, making real historical acceptance appear incompatible with usable platform capabilities. Refs https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues/29.

## Decision

Correct contradictory PTY docs, declare the official source placeholders that the CLI now materializes, and test both default and explicit portable project launch. Keep interpreter adaptation separate from the platform native interpreter and ordinary application commands.

## API Design

Reuse existing manifests, source placeholders, provider operations and CLI resource journals. No new target schema, status taxonomy, registry service or copied per-template recipe.

## Alternatives considered

Do not expose an expanding state matrix to users or replace genuine failures with a support badge. Do not infer a current user-entry pass from old guest/bridge HTTP tests.

## Dependencies

CLI source materialization: https://github.com/Alibaba-Agent-Sandbox/agent-sandbox/issues/136 . Provider setup: https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues/29 . Template public-entry checks: https://github.com/Alibaba-Agent-Sandbox/awesome-templates/issues/203 .

## Test Strategy

Run owner checks and scope-specific regressions. Execute the real public launch matrix separately with exact reviewed source refs. Keep missing backend checks explicit.

## Acceptance criteria

Guides have usable examples and precise scope; historical receipts remain unchanged; required owner checks and current-head CI pass. New backend claims require executed receipts, actual caller endpoint assertions and independent owned cleanup.
