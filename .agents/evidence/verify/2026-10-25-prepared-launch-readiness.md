# Prepared-launch readiness follow-up

Date: 2026-10-25
Result: PARTIAL

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
