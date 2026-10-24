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

## Observed proxy authentication follow-up

The real same-sandbox probe confirmed direct Bearer200, proxy Bearer401, and proxy X-Access-Token200. Consumers now use the already-supported application header without replacing gateway credentials. The provider revision raises its uniform host floor to CLI0.4.16 / paired Python SDK0.3.1a4; no conditional version schema or new status is introduced. Prior0.4.15/a3 direct receipts remain historical facts. Final native CI additionally exercises explicit proxy CLI/Python and independent Node ServerClient with exact producer refs. Refs https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues/31 .
