# OpenSandbox acceptance with the final compatible hosts

Result: PASS

This is a new execution, separate from the earlier default/portable receipt.
[Native T4 run 40106702699](https://github.com/Alibaba-Agent-Sandbox/awesome-providers/actions/runs/40106702699)
completed successfully with these exact inputs:

- Provider: `0a5dc608e192055ed61b9e547a48d523a0d43105`.
- CLI: `33c4e890d8017c6c89bb8e105a1f8432537ac3d0` (0.4.15 candidate).
- Python client/server SDK: `b2b9757be40df340bc8275386f5c23dbb55fa955` (0.3.1a3 candidates).
- Templates: `cd1de48216b933da95785412b9e49c75ad9a0676`, `python-hello`.

Environment: GitHub Ubuntu hosted runner, Node 22, Python 3.12, real Docker-backed
OpenSandbox server 1.1.1, release-1.1.1 execd pinned by digest in the workflow,
and a job-owned local Docker registry. No model or cloud credentials were used.

All workflow steps passed, including actual host project staging/parser,
installed SDK/CLI home fixture, direct plugin and installed contract/environment
tests, Python SDK scenarios, CLI lifecycle/process/files, and both native project
build/push/launch runs:

```sh
node opensandbox/tests/project-launch.mjs
ABX_WORKFLOW_BUILD_PROFILE=portable node opensandbox/tests/project-launch.mjs
```

Each project run exercised CLI application commands, Python connection to the
created sandbox, and separate Python creation from the prepared immutable image.
The first used the unchanged default source recipe, without selecting portable.
This verifies source-host integration; the workflow builds the exact CLI source
and invokes its entrypoint, and does not claim an npm package publication test.

Cleanup scope: the project harness deleted its known sandboxes; the independent
final workflow step confirmed no `sandbox-` Docker containers remained and
removed the job-owned registry container. The hosted runner was disposable.
This does not prove persistent ACR/tag cleanup, every OpenSandbox deployment,
all 46 templates, full application controllers, or model-backed business tasks.
Those claims require their own receipts. The separate installed-package public
matrix remains unexecuted at this checkpoint.

[Owner CI run 40106702689](https://github.com/Alibaba-Agent-Sandbox/awesome-providers/actions/runs/40106702689)
also passed at the exact provider input above. Compatible CLI/SDK publication
remains a separate merge dependency. This record-only follow-up does not change
provider runtime code, metadata, or the tested workflow.
