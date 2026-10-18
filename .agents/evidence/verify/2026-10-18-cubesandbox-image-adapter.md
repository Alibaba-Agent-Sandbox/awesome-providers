# CubeSandbox image adapter verification

Result: PARTIAL

Date: 2026-10-18. Base: `d9dc871`. Scoped files: `cubesandbox/provider.mjs`,
`cubesandbox/templates.mjs`, `cubesandbox/tests/`, `cubesandbox/docs/README.md`,
`.github/workflows/ci.yml` and matching engineering records. Node: 22.22.2.
No production manifest, catalog feature claim, dependency or version was changed.

## Verified upstream contract

Sources were fetched at exact TencentCloud/CubeSandbox revision
`e0c1820ac2132df08bd4912e614486717275b956`:

- [Models](https://github.com/TencentCloud/CubeSandbox/blob/e0c1820ac2132df08bd4912e614486717275b956/CubeAPI/src/models/mod.rs):
  create input, CPU millicores, memory MiB, registry fields, `jobID`/`templateID`,
  public `buildID`/`templateID` status response.
- [Handlers](https://github.com/TencentCloud/CubeSandbox/blob/e0c1820ac2132df08bd4912e614486717275b956/CubeAPI/src/handlers/templates.rs):
  `POST /templates` returns 202; job status GET returns 200.
- [Services](https://github.com/TencentCloud/CubeSandbox/blob/e0c1820ac2132df08bd4912e614486717275b956/CubeAPI/src/services/templates.rs):
  native submission mapping, alias validation/lossy tag handling and HTTP probes.
- [CubeMaster public status handler](https://github.com/TencentCloud/CubeSandbox/blob/e0c1820ac2132df08bd4912e614486717275b956/CubeMaster/pkg/service/httpservice/cube/template_commit.go):
  `handleTemplateBuildStatusAction` maps internal job states to lowercase public
  `building`, `ready`, `error`; only `ready` establishes completion.

The first local draft/fixture used internal uppercase job constants. Following the
full client → CubeAPI → CubeMaster handler chain during review found that this
would reject valid public status responses. Adapter, T0 and installed-host fixtures
were corrected before commit. Earlier uppercase-fixture passes are not public API
verification and are superseded by the corrected checks below.

## Commands actually run

- `node tests/run.mjs` from `cubesandbox/`: exit 0; 10 passed, zero skips. Actual
  loopback HTTP observes one submission, two `building` responses and final
  lowercase `ready`, plus a real 307 redirect that reaches no credential trap.
- Negative control in a temporary copy restores uppercase-only status handling:
  same runner exit 1; 7 passed, 3 failed. Native wire, optional key and malformed
  status regressions detect the wrong contract. Temporary copy removed.
- `ABX_CLI_ENTRY=<reviewed built host entry> node tests/installed-host.mjs` from
  `cubesandbox/`: exit 0. A temporary opted-in copy installs through the unreleased
  local CLI, then dispatches `template from-image` to native CubeAPI loopback.
  Checked CPU core→millicore conversion, private registry body, own-key-only
  headers and strict ready result. This is local installed-host acceptance, not
  published host compatibility or a real CubeAPI server.
- `node tests/run.mjs` from `opensandbox/`: exit 0; 51 passed, zero skips.
- Native Node syntax checks for adapter, provider and test modules: exit 0.
- `git diff --check`: exit 0.
- Local Markdown link resolution and unchanged gated-manifest check: PASS.
- Staged configured-secret scan across nine scoped files: PASS; no values emitted.

All loopback servers close owned connections in finally. Installed-host fixture
removes its isolated HOME and temporary plugin tree. No cloud resources created.

## Missing gates

No running official CubeAPI or KVM cluster is available. Live image build, template
registration, sandbox create, exec and kill were not run. Host/schema coordination,
compatible delivered versions and live acceptance remain pending; the provider
capability stays undeclared. Remote CI is a separate required PR check. Issue #9
remains open, and this is partial implementation rather than completed live support.
