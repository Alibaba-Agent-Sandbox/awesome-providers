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
