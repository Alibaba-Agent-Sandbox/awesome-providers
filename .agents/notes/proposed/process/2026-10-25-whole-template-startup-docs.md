# Decision: Align provider guidance with whole-template startup

Status: proposed

## Problem

Current provider docs describe `startup: exec` and an application workflow as template author choices after the coordinated v5 contract removes those choices.

## Decision

Describe `start_cmd` as the template declaration and exec startup as the launcher-derived mechanism. Distinguish retained internal Provider `[workflow] inputs/startups` metadata from public template fields. Update English/Chinese guidance, OpenSandbox READMEs and the contributor skill.

## API Design

No plugin, manifest, catalog or installation protocol changes. A v5 template starts as a whole, preserving every declared service. No selectable workflow is introduced.

## Alternatives considered

Renaming internal metadata would change plugin identity and require unrelated wire compatibility testing. Keep those bytes unchanged and explain their internal purpose.

## Dependencies

- [Provider issue 37](https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues/37)
- [CLI unified launch PR 152](https://github.com/Alibaba-Agent-Sandbox/agent-sandbox/pull/152)
- [Python unified launch PR 108](https://github.com/Alibaba-Agent-Sandbox/python-sdk/pull/108)

## Test Strategy

Check changed Markdown local links, whitespace and scope. Run existing T0 tests and remote required checks. No new cloud acceptance is claimed for prose changes.

## Acceptance criteria

Both languages consistently describe whole-template startup, internal provider metadata is unambiguous, and runtime/plugin/catalog bytes remain unchanged.

## Evidence

[Documentation verification](../../../evidence/verify/2026-10-25-whole-template-startup-docs.md)
