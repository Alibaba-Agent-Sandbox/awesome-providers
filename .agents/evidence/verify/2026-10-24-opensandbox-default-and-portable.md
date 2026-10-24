# OpenSandbox default and portable source launch acceptance

Result: PASS

The real Docker T4 workflow [40105713813](https://github.com/Alibaba-Agent-Sandbox/awesome-providers/actions/runs/40105713813)
completed successfully at provider candidate `f55e061650efb182745d92dcf3f39fb3e1b43f96`.
The runner used Node 22, Python 3.12, OpenSandbox server 1.1.1 and the pinned
release-1.1.1 execd digest declared in `.github/workflows/opensandbox-live.yml`.

Reviewed inputs:

- CLI `90d6c3abfbb0b717ad5cc6e3922c6a18f6ecc960` (candidate 0.4.15).
- Python SDK `4bc11a701b8c262aefb27f6e59780749b1d3cb08` (candidate 0.3.1a3).
- Templates `7afc10cdd90cf01bc6871caae0a7f62aeec471d8` (`python-hello`).

All workflow steps passed: actual host staging/parser; installed SDK fixture;
real Docker-backed OpenSandbox startup; direct plugin and installed contract/environment
tests; Python SDK scenarios; CLI lifecycle/process/files; project build/push/launch;
and independent sandbox-container cleanup.

The project step executed `node opensandbox/tests/project-launch.mjs` for the default
recipe and then `ABX_WORKFLOW_BUILD_PROFILE=portable node opensandbox/tests/project-launch.mjs`.
Both exercised CLI application invocation, Python connection to the created instance,
and independent Python creation from the prepared immutable image. The default run
has no pre-converted source or portable-profile substitution.

Cleanup confirmed no sandbox containers remained and removed the job-owned local
registry container. This used a disposable hosted runner and no cloud or model
credentials. It does not certify production registry image retention policy, other
OpenSandbox deployment modes, model tasks, or all 46 source-template workloads.
The separate public matrix runner remains unexecuted at this checkpoint.

The existing owner CI run [40105713696](https://github.com/Alibaba-Agent-Sandbox/awesome-providers/actions/runs/40105713696)
also passed at this candidate. Its T0 jobs cover project/operation contracts,
OpenSandbox, CubeSandbox and E2B. Publication of compatible CLI/SDK versions remains
a merge dependency, separate from this native candidate acceptance.
