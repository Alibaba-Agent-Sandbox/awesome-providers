# Provider maturity and OpenSandbox validation

Result: PASS

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
- Initial OpenSandbox startup failed when the Docker-compatible runtime's version endpoint could not inspect the restricted host cgroup. A private cgroup namespace allowed the daemon version request. The TCP service needed asyncio and an explicit advertised loopback address in this environment.
- A real local OpenSandbox lifecycle API subsequently created containers and execd answered ping. Full local EPP did not pass: default host endpoints were not reachable at first; a Podman-normalized image name differed from the fixture; later host-network/container-cleanup behavior left an execd tied to a removed rootfs (`mkdir /tmp: no such file or directory`). Local CLI: 6 passed, 4 failed. These are restricted local-runtime results, not a claim of general upstream incompatibility.
- Native Docker run 39207300693 against the digest-pinned Oct-18 latest image passed direct EPP, installed doctor and the full 18-case kit before being cancelled during SDK scenarios. Cleanup passed. The local environment-variable difference did not reproduce in the ordinary Docker EPP test, so it is not established as a general upstream regression.
- Investigation found the SDK contract fixture changed only Python `_CONFIG_FILE`, while the spawned CLI engine still used the process HOME. The fixture now sets a shared temporary HOME/USERPROFILE and `.abx/config.toml`. New T1 regression invokes the real CLI doctor on the SDK-installed plugin. Negative control on the original fixture fails; the fix passes (1 test), restores prior environment/configuration, and performs no native backend call. T0 rerun: 51 passed.
- The workflow now pairs released server 1.1.1 with digest-pinned release-1.1.1 execd, streams SDK diagnostics, and bounds the SDK step. This is a deliberate tested version pair, not a claim that moving nightly builds are broken everywhere.
- Cleanup: the isolated Docker-compatible API reported zero containers after forced removal. Local OpenSandbox and runtime were stopped; neither the test server nor residual execd answered HTTP afterward (status 000). No host packages, global config, permissions, cloud resources or credentials were changed.

- Native post-fixture run 39208372859: T1 fixture regression passed; direct EPP, install/doctor, 18-case kit and all configuration probes passed (11/11 orchestrator checks). SDK: 22 passed, 1 failed solely because the old missing-sandbox assertion expected E8005. The documented sandbox-get/connect contract returns SandboxNotFoundError/E2009. The assertion now requires that precise type and code; no accepted error set was broadened. CLI was skipped by the failed preceding step, and cleanup passed. Final corrected-head CI remains an external gate.

The added live workflow uses an ordinary disposable Docker runner and reviewed CLI/SDK sources, runs direct EPP, installed SDK contracts/environment precedence and CLI round trips, and verifies cleanup. The corrected product/test tree passed all native workflow steps in run 39208622409: 23 SDK contract tests and 15 CLI checks, no skips. See [native Docker evidence](2026-10-19-opensandbox-native-docker.md). Earlier cancelled or failing runs remain historical, not complete passes. Later record-only changes and remote merge/post-merge checks are reported on the PR. No mock run or server health is recorded as native acceptance. Other native providers are explicitly deferred and not tested. OpenSandbox remains Beta regardless of a scoped live result.

Dependencies:
- https://github.com/Alibaba-Agent-Sandbox/registry/pull/10
- https://github.com/Alibaba-Agent-Sandbox/website/pull/10
- https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues/11

Scope: PASS applies to the maturity delivery, fixture regression and recorded Docker subset. The restricted workspace full native attempt remains PARTIAL/FAIL as detailed above; no formal Beta promotion is implied.
