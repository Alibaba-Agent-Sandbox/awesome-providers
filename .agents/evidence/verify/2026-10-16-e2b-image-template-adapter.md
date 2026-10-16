# E2B image template adapter verification

Result: PARTIAL

Date: 2026-10-16. Base revision: `873f033`; scoped files: `e2b/provider.mjs`,
`e2b/templates.mjs`, `e2b/tests/`, `e2b/docs/README.md`, `.github/workflows/ci.yml` and
the matching engineering note. Node: 22.22.2. Official SDK: `e2b@2.55.0` installed in a
throwaway directory with lifecycle scripts disabled.

Commands actually run:

- `pnpm add --dir "$SDK_TEST_DIR" --ignore-scripts e2b@2.55.0`: exit 0.
- `E2B_TEMPLATE_SDK_MODULE="$SDK_MODULE_URL" node tests/run.mjs` from `e2b`: exit 0;
  13 passed, including unit/privacy/cancellation tests and actual-SDK loopback contract.
- `node tests/run.mjs` from `e2b` without the optional SDK module: exit 0;
  12 passed and the actual-SDK contract check is explicitly skipped.
- `git diff --check`: exit 0.
- Native Node syntax checks for the provider, adapter and test modules: exit 0.
- Scoped secret scan against configured secret values: PASS across 9 task-owned files;
  no values or matched source contents were emitted. Local Markdown link resolution: PASS.
- `node tests/run.mjs` from `opensandbox`: exit 1; 50 passed, 1 failed. The existing
  paused sandbox mock expected `Cannot reach OpenSandbox` but this environment returned
  HTTP 502 `Bad Gateway ... server closed connection`. No OpenSandbox runtime file
  was changed, and this result is not described as a pass.

The actual-SDK test verifies requests to v3 template create, v2 build trigger and ready
status polling on a loopback server. The loopback server closes all owned connections in
finally. It creates no cloud resources. CI configuration was updated locally; no remote
CI result is implied.

Live E2B build/create/exec/kill: not run because authorized `ABX_E2B_API_KEY` is missing.
Generic E2B environment configuration for another backend is not reused as E2B cloud
authorization. Dockerfile/image acceptance and template list/get/delete are not verified.
Host dispatch and capability declaration remain pending review, so this is partial delivery.

Compatibility review found that the SDK's top-level Node 20 engine claim conflicts with
its statically imported `@e2b/dockerfile-utils@0.1.1` dependency (`node >=22`). The image
feature and its CI job now target Node 22+. Node 20 execution was not run: no separate
Node 20 executable was available in the checked standard installation locations. No
Node 20 image-build pass or host release is claimed.

An initial npm installation failed inside the platform npm's own `minipass-flush`
dependency. The existing pnpm client successfully installed the SDK in the throwaway
directory. No platform dependency or permission was modified.
