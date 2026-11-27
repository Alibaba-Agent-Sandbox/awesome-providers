# Decision: Deliver platform plugins for the unified Provider contract
Status: proposed

## Problem

The target CLI, Python Client SDK and Node Client SDK need the same resource semantics without requiring SDK users to install or run `abx`. Current plugin declarations, host interfaces and authoring instructions describe an older capability model and CLI-hosted execution. Renaming those entries would not establish the new resource operations, language-specific implementation selection or retention of one-time access credentials.

This repository owns platform plugins, their descriptions, packages and catalog. It does not own the Client SDK, Server SDK, generic source preparation, CLI command parser or internal cross-language host. This is an implementation plan for the unified design, not a statement that the interfaces or provider qualification have shipped.

## Decision

Deliver the following tasks in order. Each task keeps its own scoped implementation and verification evidence; completion of this proposed record does not complete any implementation task.

| Task | Delivery interface | Order and completion boundary |
| --- | --- | --- |
| PV-01 | Plugin descriptors and operation declarations that consume the neutral resource/target, creation, connection and private-access contracts | After the Python-owned neutral contracts and fixtures are available; validate declarations before migrating execution |
| PV-02 | Explicit Node/Python factory registrations and accurately generated `supported_operations` for each catalog-owned plugin implementation | After PV-01; native Python is preferred when provided, otherwise a supported Node-only artifact uses the Node-owned internal host |
| PV-03 | Platform create/get/connect/port-resolution/delete adapters that preserve real identity, access state and lifecycle behavior | After PV-01; use the selected implementation throughout the Client lifetime and prove request/response mappings |
| PV-04 | Installable plugin artifacts and catalog metadata usable by the independent CLI and SDK preparation paths | After PV-02 and the consuming source-preparation modules; verify fixed local/Git/package sources, platform dependencies and loading origins |
| PV-05 | Backend qualification, bilingual authoring instructions and the provider Skill synchronized with delivered interfaces | After the relevant implementation tasks; publish only observed support and retain failed/skipped evidence |

Do not require every third-party author to implement two languages. A language implementation may expose a smaller operation set, but a supported operation must satisfy the same declared contract and support conditions. Missing operations fail explicitly; the host must not switch implementations or platforms per method.

Existing built-in Express implementations are not moved into this repository merely by this plan. Their default SDK packaging and migration belong to the corresponding Client owners. Any proposal to create a new Express plugin source directory must explicitly establish its ownership before implementation; shared Express contract fixtures still apply to the built-in implementations.

## API Design

PV-01 consumes the neutral contracts instead of maintaining a competing definition. Plugin descriptions identify the Provider, configuration schema, operation-contract version, operation declarations and each implementation's language, ABI, factory entry, supported operations and artifact identity. Standard operations reference shared IDs; platform extensions use the owning Provider namespace and actual `resource`/`target`. CLI paths are relative mappings, not arbitrary mount locations. Account-specific api-key/team/quota operations remain Provider extensions where implemented.

| Boundary | Plugin obligation | Observable result |
| --- | --- | --- |
| Factory registration | Bind declared IDs to actual handlers; create local bindings without connecting during import; expose explicit close behavior | Static help needs no plugin execution; undeclared or missing handlers are rejected before business I/O |
| `sandbox.create` | Validate the selected source, `create_support` and supported provider options; preserve omitted, false, zero, empty and null semantics | Exactly one native creation; unsupported inputs fail before creation; observed state does not imply application readiness |
| `sandbox.get` | Query the bound target without recovery or renewal | Read-only queries cannot silently connect, resume or manufacture missing access credentials |
| `sandbox.connect` | Declare and perform the platform's actual connection behavior, including possible resume or expiry changes | An explicit call obtains available access state; unsupported connect is not replaced with create or a misleading get |
| Private completion/access | Return public operation data and the neutral runtime's separate private access state; bind state to the selected implementation and actual platform/account/region/instance | Native and cross-language callers retain required credentials without exposing them in CLI JSON, MCP results or logs |
| Port resolution | Resolve the requested service/protocol/port from bound access state and reliable platform information | The transport receives the actual endpoint and authorized authentication; envd and business traffic credentials are not interchanged |
| Close/delete | Close local plugin resources independently of explicit deletion; retain usable deletion state when a remote delete fails | A retry can address the same resource; borrowed instances remain alive on close; sibling clients are not closed |

Identity adapters must distinguish real cloud template IDs from aliases, display names and response fields with different semantics. Do not infer an old instance's template identity from the current same-named template. A platform-authenticated service uses the platform's confirmed public/protected policy; unknown policy and missing tokens stay errors. Services explicitly using the user-selected MD5 rule require the actual template and instance IDs on both sides. That derived value is not strong identity authentication or a native platform access token. Provider metadata must not silently choose either application-authentication mode.

For Express consumers, the shared mapping work includes the native `network.allowPublicTraffic` creation option and preservation of create/connect access credentials. A get/list response that omits a traffic token cannot recreate it. Catalog plugins implement equivalent behavior only where their own platforms support it; Express field names are not imposed on all providers.

PV-04 supplies real descriptors, fixed source/artifact identities and dependency information to the common source-preparation mechanism. Node owns that mechanism and the internal Node host; Python owns its native consumption. A plugin package is not a helper package, and this repository does not implement helper installers or duplicate business HTTP clients. Source installation must work without a mandatory npm/PyPI publication, while execution loads only prepared artifacts. No runtime installation or public engine command is introduced.

## Alternatives considered

- Keeping the full CLI as the SDK host would preserve the installation and global-configuration dependency that the target design removes.
- Requiring all plugins to maintain Node and Python implementations would add maintenance without proving a user need. Supported native implementations and an internal Node-only path are sufficient.
- Putting the generic host, Client transport or Server SDK here would mix platform adaptation with product runtimes and create reverse dependencies on plugin packages.
- Encoding access tokens in public operation results or asking users to carry token JSON files would break the shared output and normal connection contracts. Private runtime state is the narrower interface.
- Treating identical operation names as complete compatibility would miss field projection, access-token, cancellation and lifecycle differences. Qualification must exercise behavior.

## Dependencies

The companion records below target `main`. Each link becomes available when that owner's planning PR merges; publishing a plan does not establish product delivery.

- [Python contracts and Client/Server plan](https://github.com/Alibaba-Agent-Sandbox/python-sdk/blob/main/.agents/notes/proposed/architecture/2026-11-27-unified-design-plan.md): owns neutral schemas/fixtures, Python Client and Server behavior, and the Python side of private access and lifecycle handling.
- [Node Client/runtime/source-preparation and Server plan](https://github.com/Alibaba-Agent-Sandbox/nodejs-sdk/blob/main/.agents/notes/proposed/architecture/2026-11-27-unified-design-plan.md): owns Node loading, internal host, source preparation and Node Server SDK; must not depend on `abx`.
- [CLI plan](https://github.com/Alibaba-Agent-Sandbox/agent-sandbox/blob/main/.agents/notes/proposed/architecture/2026-11-27-unified-design-plan.md): consumes Node modules and owns user confirmation, private CLI storage, parameter/help projection and deployment integration.
- [Template plan](https://github.com/Alibaba-Agent-Sandbox/awesome-templates/blob/main/.agents/notes/proposed/architecture/2026-11-27-unified-design-plan.md): consumes supported template/create behavior and publishes author examples without implementing plugin runtimes.
- [Registry plan](https://github.com/Alibaba-Agent-Sandbox/registry/blob/main/.agents/notes/proposed/architecture/2026-11-27-unified-design-plan.md): consumes plugin package metadata for discovery and distribution; it does not select implementations during business calls.

Release shared contracts before dependent plugin/consumer releases. Runtime owners can implement against fixed fixtures while plugin work proceeds; do not create a cycle where a plugin needs an unreleased host that itself requires that new plugin to be installed. The proposed record for this repository uses the same candidate branch and path.

## Test Strategy

For this documentation-only plan, run the repository's applicable record and link checks and identify same-batch references as pending. No backend, installation or package-release pass follows from document validation.

For implementation, retain the repository's T0–T4 distinctions. Run the existing per-provider unit entry points where applicable, including `node tests/run.mjs` for OpenSandbox; adapt integration commands to the delivered interfaces rather than using old command spellings as target acceptance. Verify installation and actual loading separately from native backend operations. Built-in Express verification remains with its owning Client repositories and is not a catalog-plugin T5 pass.

Use the neutral fixtures for both languages: full field mapping, invalid support combinations, static registration parity, real ID normalization, private access transfer, unknown public policy, explicit connection effects, cancellation, close isolation and failed-delete retry. An installed Node-only provider must run through the Python SDK with no `abx` and no inherited CLI configuration. Test local and fixed Git sources plus optional package artifacts, dependency/import origin, unsupported platforms and immutable installed versions.

For a real backend, exercise supported create/use/connect/delete behavior and independently confirm deletion of resources owned by the run. Preserve real failure and unknown-result cases without broad retries. Reuse a controlled environment where possible; no extra databases or unrelated deployment matrix is required. Redact access data, do not record private identifiers, and keep original provider evidence in its established location with a repository-level summary.

Publication or document checks do not move this implementation plan to `implemented`; that requires the applicable product acceptance criteria and the repository lifecycle rules.

## Acceptance criteria

- PV-01 declarations pass the same neutral contract fixtures used by Python and Node; unsupported operations or fields fail before business side effects.
- PV-02 implementation selection stays fixed throughout operations, endpoint resolution and cleanup; available language subsets are reported accurately.
- PV-03 proves public/protected/unknown entry behavior, private credential retention across supported consumers, real target identity and explicit connection lifecycle effects on each claimed platform.
- SDK-only users can install and use a supported plugin without the CLI, public engine commands, runtime package installation or implicit CLI configuration.
- Source-based plugins work through the prepared-artifact mechanism without mandatory package-registry publication; plugin and helper identities remain distinct.
- Local close preserves borrowed remote resources, failed deletion remains retryable, and actual owned-resource cleanup is independently checked.
- Bilingual docs, catalog metadata and the provider Skill describe the delivered interface and observed limits. T0, installed-host checks and native backend evidence remain separate; a missing mandatory check keeps the corresponding task incomplete.
- The ADR remains proposed until its own acceptance and repository contribution gates are met. It does not label future product tasks, releases or backend compatibility as implemented.

Document validation and review disposition: [verification](../../../evidence/verify/2026-11-27-unified-design-plan.md).
