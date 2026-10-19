# Decision: Explicit provider acceptance stage

Status: proposed

## Problem
Official maintenance and built-in packaging do not identify an accepted release.

## Decision
Express is Stable in the current accepted scope. The four catalog providers remain Beta; other native acceptance is deferred by the maintainer. OpenSandbox installation/live verification is attempted and recorded separately without automatic promotion.

## API Design
Provider-owned catalog schema 2 adds strict `maturity: stable | beta`. Schema 1 and missing declarations default to Beta. Registry output and installer index carry maturity; bilingual cards, comparisons and template prerequisites display it. Built-in metadata explicitly opts into Stable. Runtime capabilities, IDs, installation and updates are unchanged. Shared display originates in website/ui.

## Alternatives considered
Reusing official or builtin conflates ownership with acceptance. Vendor-ID switches in consumers violate provider ownership. Automatic promotion after partial tests overstates coverage.

## Dependencies
Catalog consumers accept schema 2 before provider packages land; shared UI is synchronized from the reviewed website source. Each repository owns its own record and PR.

## Test Strategy
Validate strict schema and Beta defaults; build both languages and inspect rendered badges, including template rows. Run provider T0 checks. Separate actual OpenSandbox installation/live attempts from mocked coverage and record cleanup.

## Acceptance criteria
Only Express is Stable; four catalog providers are Beta across discovery and machine-readable output. Existing metadata is compatible and unknown providers fail closed to Beta. Real OpenSandbox results and limitations remain explicit. Required owner CI passes before merge.

## Evidence
https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues/11
