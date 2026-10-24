# Verification: Provider installation consent guidance

Date: 2026-10-24
Result: PASS — scoped checks and independent review passed; final record-only head remains subject to required merge checks.
Base: `e18489155697dcf2ee55a47b403396069d6cfa20`.
Tracking: [Issue 32](https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues/32).
Scope: OpenSandbox README pair and bilingual create/principle guides, plus records.

## Executed

- Read CLI manifest, installer, provider command and doctor implementations; read Python manifest, installer, module entry, doctor and registry implementations. Both parsers accept exec/rest/node. CLI default install supplies verifyHandshake, Python supplies verify_handshake; consent precedes writing/verification. Default verification may load and initialize code, while --yes does not disable it. Missing configuration can prevent a handshake: prose says may execute, not that every install necessarily starts a process.
- Compared explicit ProviderSandbox export and create/connect/list/instance-kill APIs with current Python source. Checked NetworkOperations.resolve returns endpoint and access headers; no new SDK API was invented.
- Published CLI 0.4.16 actual dispatch of `abx sandbox url not-a-real-id --port 9000`, `abx sandbox shell-stream not-a-real-id`, and `abx sandbox timeout not-a-real-id 60` each exited 1 with unknown-command diagnostics before backend access. The old table was inaccurate. A second review checked provider routing instead of relying on generic help: non-Express commands use the native group, which does not register pause/resume. Actual `--provider opensandbox sandbox pause/resume not-a-real-id` dispatch also returned unknown-command before backend access. The table points these operations to the SDK. Removed the grouped negative EPP-template row so it cannot obscure actual source preparation.
- `node tests/run.mjs` in opensandbox: PASS, 63 tests, no skips. These are unit/mock checks, not real OpenSandbox verification.
- `node --test tests/project.test.mjs tests/workflow-operations.test.mjs`: PASS, 16 tests, no skips.
- Checked all 16 relative Markdown targets in the six changed guides: PASS. Cross-repository links point to the existing CLI bilingual provider guide; no repository-relative sibling paths.
- `git diff --check`: PASS. English/Chinese changes match. No provider source, manifest, catalog metadata, package version or historical evidence changed.

- Remote [T0 CI 40117004563](https://github.com/Alibaba-Agent-Sandbox/awesome-providers/actions/runs/40117004563) and automatically triggered [OpenSandbox T4 40117004604](https://github.com/Alibaba-Agent-Sandbox/awesome-providers/actions/runs/40117004604) passed on `3d3ddf5b099348288f0ecd6c8c200c3cbdd178d1`. Independent review confirmed the consent boundary, explicit entry points and correction after the provider-routing check.

## Limits

No T1/cloud/model run was manually initiated for this prose correction. Local documentation checks created no sandbox or image; the existing PR workflow automatically ran its isolated OpenSandbox T4 and completed successfully. Existing live verification and the independently running full template matrix are separate evidence; this change claims neither new backend support nor full-matrix success.
