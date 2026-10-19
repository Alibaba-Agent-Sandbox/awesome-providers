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
