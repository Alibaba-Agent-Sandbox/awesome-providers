# Canonical CLI guidance verification — 2026-11-10

Result: PARTIAL — scoped documentation checks complete; coordinated CLI merge and
latest-head remote CI are separate gates.

Scope: Current provider READMEs, contributor guidance and skills now use deploy --template-id for native resources, deploy SOURCE --name for source applications, root delete, config and provider run. Provider implementation, protocol, metadata, maturity and historical acceptance evidence remain unchanged.

## Checks

- Read owning repository contributor, engineering-record and workflow instructions.
- Compared command examples with current CLI source command registration and deployment
  handlers: deploy/list/status/logs/delete/recover, template authoring, sandbox command
  invocation and provider operations remain separate.
- Changed-Markdown local link check compares missing links with HEAD; no introduced
  missing local targets. Historical records and archive examples are not rewritten.
- OpenSandbox T0: node tests/run.mjs, 63 passed, 0 failed. Project preparation T0: node --test tests/project.test.mjs tests/workflow-operations.test.mjs, 16 passed, 0 failed.

## Limits and cleanup

No release, backend operation, cloud credential use or cloud resource creation was
performed. No implementation or maturity claim follows from these documentation
checks. This repository's PR must link the CLI coordination change and wait for its
actual final command contract. Temporary local test logs remain outside the repository.

## Final documentation check

- Changed Markdown local-link audit: 19 files checked, no introduced missing file links. URL anchors and remote pages were not fetched.
- Current CLI examples use named deploy/status/delete, sandbox operations and Provider run with JSON input. Historical archived documents remain historical.
- CHANGELOG updated; no version bump or package publication.
