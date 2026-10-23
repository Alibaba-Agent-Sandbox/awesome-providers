# Engineering records: awesome-providers

This repository owns provider plugins, catalog metadata and their verification.
Read [CONTRIBUTING.md](../CONTRIBUTING.md), the provider [skill](../SKILL.md)
and the [test tiers](../docs/e2e.md) before changing a provider.

## Records and lifecycle

New records use English. Decisions live in
`notes/{proposed,implemented}/<architecture|feature|process>/YYYY-MM-DD-<slug>.md`;
rejected and superseded records are flat. `Status:` matches the state directory.
Keep a proposal pending until its actual acceptance and merge gates pass.

Use the sections Problem, Decision, API Design, Alternatives considered, Dependencies,
Test Strategy and Acceptance criteria, with optional Evidence links. Record ownership,
compatibility, alternatives, affected contracts and observable acceptance conditions.

Dated verification lives in `evidence/verify/`. Include tested revision/scoped files,
environment, actual commands/results, failures/skips, missing prerequisites and owned
resource cleanup. Mocks, installed-host tests and native backend tests are distinct.
Use `Result: PASS | PARTIAL | BLOCKED | FAIL`; missing mandatory checks prevent completion.
Preserve historical evidence; add a dated result instead of rewriting merged history.
Never store credentials, raw sensitive logs or private resource identifiers.
Cross-repository references use absolute GitHub URLs. Include records in the owning PR.

## Index

- [E2B image adapter](notes/proposed/feature/2026-10-16-e2b-image-template-adapter.md) · [verification](evidence/verify/2026-10-16-e2b-image-template-adapter.md)
- [Provider portability and updates](notes/proposed/architecture/2026-10-18-provider-portability-updates.md) · [verification](evidence/verify/2026-10-18-provider-portability-updates.md)

- [Integrated adapter CI](notes/proposed/process/2026-10-18-integrated-provider-ci.md) · [verification](evidence/verify/2026-10-18-integrated-provider-ci.md)

- [Provider acceptance stage](notes/proposed/feature/2026-10-19-provider-maturity.md) · [verification](evidence/verify/2026-10-19-provider-maturity.md)

- [OpenSandbox native Docker subset](evidence/verify/2026-10-19-opensandbox-native-docker.md).

- [Consumer entry compatibility](notes/proposed/process/2026-10-19-consumer-entries.md) · [verification](evidence/verify/2026-10-19-consumer-entries.md)

- [Lazy template SDK request](notes/proposed/feature/2026-10-19-provider-image-beta-merge.md) · [verification](evidence/verify/2026-10-19-provider-image-beta-merge.md)

- [Provider-owned template launch](notes/proposed/feature/2026-10-19-provider-template-launch.md) · [verification](evidence/verify/2026-10-19-provider-template-launch.md)

- [Remove retired project compatibility](notes/implemented/architecture/2026-10-22-remove-legacy-compatibility.md) · [verification](evidence/verify/2026-10-22-remove-legacy-compatibility.md)

- [Compatibility cleanup remote acceptance](evidence/verify/2026-10-22-remove-legacy-acceptance.md)

- [Explicit template workflows](notes/proposed/architecture/2026-10-23-explicit-template-workflows.md) · [verification](evidence/verify/2026-10-23-explicit-template-workflows.md)

- [Project interpreter audit](evidence/verify/2026-10-23-provider-interpreter-audit.md).

- [OpenSandbox maturity](notes/implemented/process/2026-10-23-opensandbox-maturity.md) · [verification](evidence/verify/2026-10-23-opensandbox-maturity.md)

- [Current-host OpenSandbox native promotion receipt](evidence/verify/2026-10-23-opensandbox-native-promotion.md).

- [Upstream maturity merge verification](evidence/verify/2026-10-23-upstream-maturity-merge.md).

- [Actual project SDK fixture and final T4 pins](evidence/verify/2026-10-23-project-sdk-fixture-and-t4-pins.md).

- [OpenSandbox YAML profile rerun](evidence/verify/2026-10-23-opensandbox-yaml-profile-rerun.md).

- [Preserve primary live workflow failure](evidence/verify/2026-10-23-opensandbox-primary-failure-preservation.md).

- [Base SDK YAML dependency rerun](evidence/verify/2026-10-23-opensandbox-base-sdk-yaml-rerun.md).

- [Native process startup acknowledgment](evidence/verify/2026-10-23-native-process-startup-ack.md).

- [OpenSandbox explicit workflow native acceptance](evidence/verify/2026-10-23-opensandbox-workflow-native-acceptance.md).

- [Workflow review host verification](notes/proposed/process/2026-10-23-workflow-review-host-verification.md) · [local verification](evidence/verify/2026-10-23-workflow-review-host-local.md).
