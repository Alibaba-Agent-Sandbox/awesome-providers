# Integrated provider CI verification — 2026-10-18

Result: PASS for local T0/T1; native cloud acceptance NOT RUN.

Sources: CubeSandbox PR10 head 57f57d9 and E2B/catalog PR5 head
e360a32fd4e2442aedb2670d19af62b9cfcd1cfd, combined with ordinary merge.
Environment: Linux, Node22.22.2; host built from CLI PR42 head 6402b7.

- `E2B_TEMPLATE_SDK_MODULE=<official e2b@2.55.0 module> node e2b/tests/run.mjs`:
  PASS, 13 tests, zero failures/skips. Official SDK makes real loopback requests.
- `node cubesandbox/tests/run.mjs`: PASS, 10 tests, zero failures/skips.
- `node opensandbox/tests/run.mjs`: PASS, 51 tests, zero failures/skips.
- Built host: locked `npm ci` with npm10.9.4, followed by `npm run build`: PASS.
- `ABX_E2B_PROVIDER_SOURCE=<E2B source> node e2e/providers/template-image.mjs`
  from the built CLI: PASS. Actual plugin install/consent, scoped dispatch, official
  SDK requests, private registry input and safe results were verified.
- `ABX_CLI_ENTRY=<built CLI entry> node cubesandbox/tests/installed-host.mjs`:
  PASS. Actual installed plugin, native API readiness, units, scope and safe results.

Initial local npm12 install omitted the optional E2B SDK, producing E8002 in the
host test. Repeating the locked installation with npm10.9.4 (Node22 CI toolchain)
installed e2b2.55.0 and the same host test passed. No lockfile changes were needed.
This is disclosed as a local toolchain prerequisite failure, not a native pass.

All loopback servers, temporary plugin homes and files were cleaned up. No cloud
resources were created. E2B-named Express credentials are not native E2B keys.
Native image creation/deployment remains unverified and capability flags stay
conservative. Remote CI is checked separately for the exact pushed head.
