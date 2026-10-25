# Prepared-launch readiness follow-up

Date: 2026-10-25
Result: PASS (public-a3 T4 and local checks; source merge pending)

Original [run 40206364834](https://github.com/Alibaba-Agent-Sandbox/awesome-providers/actions/runs/40206364834)
at provider source 410d07d failed in public a2 Python prepared-template readiness,
after default CLI source build/push/launch, CLI named command, authentication
probes and independent Node proxy calls passed. The failing step's label covered
more than image build/push; those earlier phases were successful. Final runner
cleanup passed. The private raw log remains preserved outside the repository.
The earlier passing run 40203802510 retains only its original exact-input scope.

Public a2 real causal reproduction on an Express prepared reference confirmed
that the acknowledged exact server PID remained alive, the first health command
returned 1 with connection refused, and the same port became healthy within its
readiness budget. Returning that unchanged failed probe to the public launcher
still raised readiness-command-failed. Independent typed NotFound confirmed owned
cleanup. An earlier diagnostic's false child-PID process-list assertion and its
successful owned cleanup remain recorded as a harness failure, not a product bug.

The shared SDK owns [Issue 121](https://github.com/Alibaba-Agent-Sandbox/python-sdk/issues/121)
and [PR 122](https://github.com/Alibaba-Agent-Sandbox/python-sdk/pull/122). The T4
workflow now selects exact SDK candidate 2ad2a482571bc030a7be298217cf7956bd164da4
and installs both source distributions together, without a new selector/fallback.
Templates use merged main 26d6e24e8b29b6c73b364d954dc0279d22a6f9d5 and Node uses
merged main 63d7cd8ece221b9f968eef51eeb932ea334c90d3. CLI remains its exact public
0.5.3 source. Template recipes still install public guest a2 and the actual guest
version assertion remains a2. Host candidate a3 does not imply guest a3 or public
package installation. No provider implementation or capability metadata changed.

All existing default, portable, proxy, Python/Node invocation and cleanup checks
remain required. Candidate T4, latest-head gates, normal merge and later public-a3
installation/T4 remain pending. No fixed sleep, retry of creation or relaxed
assertion was added to the harness.

## Public a3 follow-up inputs

Source-candidate run [40208641347](https://github.com/Alibaba-Agent-Sandbox/awesome-providers/actions/runs/40208641347)
completed all 18 steps SUCCESS at provider head b78ea200ba7ccb30cd868ae609cad9c7b5031e31.
Its host was candidate SDK a3 source and guest was public a2, exactly as above;
that run is not public-a3 installation or guest-a3 acceptance.

SDK PR 122 subsequently merged at a7d6aa3e5e16fcf8cde1d91465f4a5fc53f5a030.
Official [v0.4.0a3 publication](https://github.com/Alibaba-Agent-Sandbox/python-sdk/actions/runs/40209677091)
succeeded; independent fresh installation and all four artifact hashes matched
actual PyPI bytes. The current T4 now checks out that immutable SDK tag for its
existing runner, but installs `agent-sandbox-client==0.4.0a3` from official PyPI,
which requires the matching public server package. No local SDK source is installed.

Template PR 225 was independently read back at exact head
cbef1cde59e760f7fbae4482cc03b23f636dc569; both default and portable python-hello
Dockerfiles install public server a3 from the official index. The actual running
guest assertion is a3. CLI and Node source pins remain their previously reviewed
inputs. This is a template source candidate with public host/guest Python packages;
it is not a claim that the template PR is already merged.

This exact public-a3 T4 and current-head gates remain pending at this checkpoint.
All default/portable/proxy consumers and owned cleanup assertions remain required.

Local follow-up: project/operation tests 16 PASS, OpenSandbox T0 63 PASS, live-gate
regressions 3 PASS, embedded runner syntax and diff checks PASS. An initial local
invocation referenced nonexistent test filenames and was corrected to repository
commands; the fresh public runtime-only environment lacks pytest, so the harness
unit checks used the existing development environment instead. These setup errors
are not product failures and do not substitute for the pending real T4.

## Actual public a3 T4 result

[Run 40212643836](https://github.com/Alibaba-Agent-Sandbox/awesome-providers/actions/runs/40212643836),
job 121226993987 at exact provider head f4769f2308d1649038bbb6f70285cd3e1603417c:
all 18 steps completed SUCCESS, including final Docker cleanup.
[Sanitized receipt](2026-10-25-public-a3-opensandbox-t4.json) retains exact inputs
and all step outcomes. The private raw log is preserved outside the repository.

Default/direct, portable/direct and default/server-proxy each passed source build,
local-registry push, automatic launch/readiness, CLI named-command calls, public
Python application calls and Python prepared-reference launch/owned cleanup.
All three actual guest runtime assertions were a3. Both explicit proxy probes
passed independent Node ServerClient calls and the existing authentication checks.
Plugin/installed contract kit, public Python scenarios and CLI lifecycle/file/command
checks passed. Final cleanup verified no sandbox containers remained.

This follow-up also updates only the current English/Chinese acceptance-page
installation recommendation to public a3 with the official index. Old acceptance
receipts retain their actual source/package identities and failures. No runtime
or test assertion changed after f4769f2; this final evidence/docs commit still
requires normal current-head checks/review and remote merge confirmation.
