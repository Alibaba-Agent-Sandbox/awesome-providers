# Provider maturity and OpenSandbox validation

Result: PARTIAL

Date: 2026-10-19. Base dbd4bb04e72c6c03849f90af3b328b93bb7d491b.

Scope: schema-2 provider-owned Beta metadata, matching index/YAML and patch versions, bilingual provider documentation and native OpenSandbox CI.

- OpenSandbox T0: `node tests/run.mjs`, 51 passed, 0 skipped.
- CubeSandbox T0: `node tests/run.mjs`, 10 passed.
- E2B T0: official SDK 2.55.0, 13 passed, no native cloud credentials used.
- Four manifest IDs/patch versions, catalog schema/maturity, index and YAML declarations agree. All four remain Beta; only accepted Express is Stable, as explicitly requested by maintainer.
- Registry schema regression: 13 passed; strict schema 1 remains supported and defaults Beta. Schema 2 requires an explicit valid maturity. Both machine outputs carry the stage.
- CLI local linked installation of OpenSandbox 0.3.2 succeeded. Generic offline harness: 14 passed, 1 failed because its old expectation hides the provider group from fresh root help; current reviewed host intentionally exposes provider commands. This unrelated harness assertion was not weakened or counted as a pass.
- Local OpenSandbox server 1.1.1 installed in an isolated Python 3.12.13 environment. Podman 5.4.2 and OCI runtimes were extracted into temporary state, without changing the host system or Docker socket permissions.
- An actual Alpine container executed successfully after configuring the restricted single-UID namespace, a private temporary /sys, host /dev/pts and read-only cgroup bind. This proves container startup only, not OpenSandbox acceptance. Earlier default attempts failed on mount_setattr/sys, devpts and cgroup restrictions; those failures are preserved here.
- Initial OpenSandbox startup failed when the Docker-compatible runtime's version endpoint could not inspect the restricted host cgroup. Further runtime/native investigation is in progress.

The added live workflow uses an ordinary disposable Docker runner and reviewed CLI/SDK sources, runs direct EPP, installed SDK contracts/environment precedence and CLI round trips, and verifies cleanup. Workflow execution and actual results are external gates still pending. No mock run or server health is recorded as native acceptance. Other native providers are explicitly deferred and not tested. OpenSandbox remains Beta regardless of a scoped live result.

Dependencies:
- https://github.com/Alibaba-Agent-Sandbox/registry/pull/10
- https://github.com/Alibaba-Agent-Sandbox/website/pull/10
- https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues/11
