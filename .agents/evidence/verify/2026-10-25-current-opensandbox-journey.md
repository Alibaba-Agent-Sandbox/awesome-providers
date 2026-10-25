# Current OpenSandbox journey verification

Date: 2026-10-25
Result: PARTIAL

Scope: existing OpenSandbox T4 workflow/runner, SDK fixture, current provider
guide and installation recommendations. Plugin implementation/metadata unchanged.

- `node tests/run.mjs` in opensandbox: PASS, 63 tests.
- `node --test tests/project.test.mjs tests/workflow-operations.test.mjs`: PASS,
  16 tests.
- `pytest opensandbox/tests/harness/test_live_gate.py --confcutdir=opensandbox/tests/harness`:
  PASS, 3 tests (no opt-in skips; explicit missing/unreachable backend fails).
- Node syntax check and compilation of the actual embedded Python launcher:
  PASS; corrected import is `agent_sandbox.api.template.launch_template`.
- Public a2 ProviderSandbox and template-launcher imports: PASS.
- Independent review by the template reviewer retained default/portable/proxy,
  Python/Node application calls and cleanup. Guest version is checked explicitly.

Selected candidate inputs: CLI PR170 20a0fc8c252ec4c048d6cd257d50b2522fc187a4,
templates PR222 ecead480736b2791f220d4c3f42fa8a128bacd1a, public SDK v0.4.0a2,
Node source a4e24a81d9a6305a7a6e992fd9cec6077587537a. This is not a public
CLI 0.5.3 installation claim. Required real Docker T4 remains pending; this local
environment has no Docker. No cloud resource was created for these local checks.
Old and failed receipts remain historical. Platform-native credential names
belonging to the OpenSandbox server itself are not obsolete project aliases.

Issue: https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues/39

First candidate T4: FAIL at the explicit actual guest-version assertion, after
installed-host fixture, 11 backend/environment checks, SDK contract scenarios,
CLI lifecycle, source preparation, launch and the CLI named HTTP call passed.
The runner cleanup step succeeded. No inference that host a2 implies guest a2.
The original failed source pin is preserved in workflow history. Template builds
independently exposed a base-image pip mirror missing a2; selected template source
now explicitly uses official PyPI. The next T4 run selects templates candidate
f2a5bb4345769b3481985a9b4f4138358ea36634 and merged CLI 0.5.3 source
6dfdf9897ad76bf2fdb7eb1ccf455252b2dcb9fb; adds the observed guest version to
failure diagnostics instead of a bare assertion. Complete T4 remains pending.
