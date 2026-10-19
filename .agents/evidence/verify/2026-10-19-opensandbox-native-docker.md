# OpenSandbox native Docker acceptance subset

Result: PASS

Date: 2026-10-19. Tested provider tree: `c47b72e043e71a5e32a38af2d24cfdc0a10ac9c8`. Workflow: [39208622409](https://github.com/Alibaba-Agent-Sandbox/awesome-providers/actions/runs/39208622409), job `117916827603`, all steps successful, including cleanup.

## Reviewed environment

- Disposable GitHub Ubuntu runner with real Docker; Node 22, Python 3.12.
- OpenSandbox server `1.1.1`, execd `release-1.1.1` pinned to `sha256:cda2bc35409bbf57561599b316cafb899598f7dce671332e7ceda14eb1cfeded`.
- Stock `python:3.12-slim` sandbox image, bridge networking, egress sidecar disabled.
- CLI `b2af4949aa8ed9dc496a4849a58450b7ccc1639b`; Python SDK `81cca585e5ac59be14f47cb53ade976f35d6446b`. Matching client/server packages installed from that reviewed SDK tree.
- Isolated test HOME and nonsecret local authentication; no cloud credentials.

## Executed checks

1. Locked CLI `npm ci` and build, matching SDK package installation: exit 0.
2. `python -m pytest -q opensandbox/tests/harness --confcutdir=opensandbox/tests/harness`: 1 passed; Python installation is visible to the actual CLI in the same isolated HOME. The original fixture fails the local negative control.
3. `provider_e2e.py --stages node-unit,node-live,install,kit,env`: 11/11 checks passed in 33 s. This includes 51 T0 tests, direct live EPP (2 tests), install/doctor, 18 real-backend contract-kit tests, and configuration precedence/authentication probes. Counts overlap and must not be added as unique cases.
4. Separate streamed `pytest` contract suite: **23 passed in 17.38 s**, no skips. Covers the 18 common contracts plus SDK streaming/exit/stderr/env/cwd, Unicode files and typed missing files, timeout/pause/resume/processes, unsupported E8004 features, and precise missing-sandbox SandboxNotFoundError/E2009.
5. `e2e/providers/run.sh opensandbox` with the built CLI: **15 passed, 0 failed, 0 skipped**. Covers consent/install, doctor, secret redaction, default/explicit selection, create/list, execution/exit status, upload/download/list, kill/not-found, pinned local Git installation and provider contract tests.
6. Always-run teardown stopped the local service, removed owned sandbox containers and asserted the isolated runner's sandbox container list was empty: exit 0.

## Scope and limits

OpenSandbox **remains Beta**. This is a verified Docker/stock-image/CLI/SDK subset, not formal promotion or Kubernetes, egress-policy, secure-access, code-interpreter or every image validation. Undeclared features remain E8004. No upstream nightly or untested version is implied by this result. Other providers' native acceptance is explicitly deferred.

The current workspace also installed and started a real server and containers, but its restricted single-UID/host-network runtime did not pass the full suite. Earlier local failures and the old SDK fixture/error expectation are preserved in [the maturity verification](2026-10-19-provider-maturity.md). They are not relabelled as passes. Local containers were verified empty through the owning runtime API, services stopped, and extracted runtime/image state removed. An initial filesystem cleanup hit read-only image directory modes; only the owned temporary directories were made writable and removal then succeeded.

Issue/PR: https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues/11 · https://github.com/Alibaba-Agent-Sandbox/awesome-providers/pull/12
