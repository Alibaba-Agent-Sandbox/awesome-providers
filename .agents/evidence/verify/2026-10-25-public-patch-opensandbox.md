# Public patch OpenSandbox verification

Date: 2026-10-25
Result: PARTIAL (merged recipe bytes checked; real T4 and current-head CI pending)

Base: merged provider PR40 at 126a50e3c4e4c6792019b9c96674d35a9518d8ad.
Issue: https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues/41.
No provider runtime/version, capability, catalog or Node SDK source change.

Prepared consumer inputs are formally published CLI .5 source
3f7fa28e16888a5489980dc56c86d6c71c11c4a0 and SDK tag v0.4.0a6 (runtime source
8e610a3658040d8d6973e7951f9590ea50a4d70a). SDK packages install only from official
PyPI; the matching server is its exact dependency. Actual guest assertion is a6.
The existing Node source stays 63d7cd8ece221b9f968eef51eeb932ea334c90d3.

PR225 normally merged to public main `389302f5dc9429a4b215801dbd4025d4dba95f7e` after all 54 final checks passed. Independent GitHub content readback of that immutable merged revision verified both default and portable python-hello recipes install exact server a6 from the official PyPI index, with no wheel/source fallback. The workflow selects that merged revision. Its recipe/manifest bytes equal the earlier reviewed candidate; the old candidate readback remains separate history. No a6 Docker/T4 pass is claimed before the real run completes.

| Merged input | SHA-256 |
| --- | --- |
| `python-hello/Dockerfile` | `cf6f86472162a08540e50722ffa2ca32a9e194b4ea1d3709722803208fb1b52c` |
| `python-hello/Dockerfile.portable` | `f751f86c4327ab0e8175b8c2a98d9a598f430569124252750915fb34710d6efb` |
| `python-hello/template.yaml` | `6628b46aef9a5f4a9e63eb675e420d71fca2d11315d43fb2e8f8c54c3ffd2789` |

All three startup paths, named CLI/Python calls, independent Node proxy requests,
authentication checks, installed contracts and final cleanup remain required.
This is planned source-built CLI testing with public Python packages, not a
fresh official npm/SEA install or all-template/platform certification.

Local preparation: OpenSandbox T0 63 PASS (0 skips), project/operation tests 16
PASS, explicit-live gating regressions 3 PASS, actual embedded runner syntax and
diff checks PASS. These tests do not establish the pending real a6 Docker scope.

The maintained Skill now recommends public CLI 0.5.5 with the current catalog,
replacing its old 0.5.0 entry; no earlier tested receipt is relabeled.
