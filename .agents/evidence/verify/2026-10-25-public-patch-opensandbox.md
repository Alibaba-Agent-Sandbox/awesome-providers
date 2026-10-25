# Public patch OpenSandbox verification

Date: 2026-10-25
Result: PASS for exact source-built consumer scope below; final record-head CI and normal merge pending

Base: merged provider PR40 at 126a50e3c4e4c6792019b9c96674d35a9518d8ad.
Issue: https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues/41.
No provider runtime/version, capability, catalog or Node SDK source change.

Prepared consumer inputs are formally published CLI .5 source
3f7fa28e16888a5489980dc56c86d6c71c11c4a0 and SDK tag v0.4.0a6 (runtime source
8e610a3658040d8d6973e7951f9590ea50a4d70a). SDK packages install only from official
PyPI; the matching server is its exact dependency. Actual guest assertion is a6.
The existing Node source stays 63d7cd8ece221b9f968eef51eeb932ea334c90d3.

PR225 normally merged to public main `389302f5dc9429a4b215801dbd4025d4dba95f7e` after all 54 final checks passed. Independent GitHub content readback of that immutable merged revision verified both default and portable python-hello recipes install exact server a6 from the official PyPI index, with no wheel/source fallback. The workflow selects that merged revision. Its recipe/manifest bytes equal the earlier reviewed candidate; the old candidate readback remains separate history. The complete real a6 Docker/T4 run subsequently passed as recorded below.

| Merged input | SHA-256 |
| --- | --- |
| `python-hello/Dockerfile` | `cf6f86472162a08540e50722ffa2ca32a9e194b4ea1d3709722803208fb1b52c` |
| `python-hello/Dockerfile.portable` | `f751f86c4327ab0e8175b8c2a98d9a598f430569124252750915fb34710d6efb` |
| `python-hello/template.yaml` | `6628b46aef9a5f4a9e63eb675e420d71fca2d11315d43fb2e8f8c54c3ffd2789` |

All three startup paths, named CLI/Python calls, independent Node proxy requests,
authentication checks, installed contracts and final cleanup remain required.
This is source-built CLI testing with public Python packages, not a
fresh official npm/SEA install or all-template/platform certification.

Local preparation: OpenSandbox T0 63 PASS (0 skips), project/operation tests 16
PASS, explicit-live gating regressions 3 PASS, actual embedded runner syntax and
diff checks PASS. These local tests are separate from the real a6 Docker result below.

The maintained Skill now recommends public CLI 0.5.5 with the current catalog,
replacing its old 0.5.0 entry; no earlier tested receipt is relabeled.

## Actual final dependency T4

Exact source head `ebb765f68eb8b1d0aa34bd13fa6e502acf9ac47c` passed all five checks: four T0 jobs and [real Docker T4 run 40233605878](https://github.com/Alibaba-Agent-Sandbox/awesome-providers/actions/runs/40233605878), attempt 1, job 121290364936. All 18 job steps completed SUCCESS, including unconditional cleanup. This counts steps, not 18 independent scenarios.

The unchanged gate ran default/direct, portable/direct and default/server-proxy native source build → registry push → launch. Each path passed the CLI named command, actual installed guest server `0.4.0a6`, Python application client, a second Python prepared-reference launch and owned cleanup (three final success markers). Two explicit proxy probes passed authentication checks, and two independent Node client proxy invocations passed. The direct plugin, installed contracts, environment checks, Python contract scenarios, CLI lifecycle/commands/files and official SDK parser with actual host staging also passed.

Cleanup verified each known owned launch ID absent from the Python/CLI lists, then teardown and the final Docker assertion verified no sandbox containers remained. This is the existing list/container-absence contract; it is not an independent typed-404 lookup. No secondary cleanup failure marker occurred. The isolated runner's registry container was removed.

The host CLI was built from the immutable released `.5` source, not freshly installed from npm/SEA in this T4. Matching official Python a6 packages and merged template recipes were used. This does not certify all templates, other clouds, Kubernetes, PTY or model execution. Older a3 passes and a2 failure receipts remain unchanged.
