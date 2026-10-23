# Actual project SDK fixture and final T4 source pins

Result: PARTIAL

Scope: `tests/project-sdk.test.mjs` and `.github/workflows/opensandbox-live.yml`, on top of adapter endpoint commit de4fbf6. References: https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues/23 and https://github.com/Alibaba-Agent-Sandbox/awesome-providers/pull/25.

## Observed failure and correction

Remote OpenSandbox run 39937562090 failed at the official SDK project parser step; Docker/backend acceptance steps did not execute. Its fixture retained `COPY *.whl` without supplying any matching file, and allowed only ten seconds for the full preparation. The corrected fixture supplies a file, implements the pinned official SDK upload-link and binary PUT protocol, and allows sixty seconds. It verifies the uploaded gzip/tar contains the original file name and payload, the serialized build still contains COPY, and the control-plane API key is absent from the upload request. Source Dockerfile bytes and temporary staging cleanup remain checked. No production Dockerfile rewriting or capability changes were introduced.

## Executed local verification

Node 22, official E2B SDK 2.55.0 and the actual built CLI staging helper:

- `E2B_TEMPLATE_SDK_MODULE=<reviewed-cli>/node_modules/e2b/dist/index.mjs ABX_PROJECT_HELPER_MODULE=<reviewed-cli>/dist/providers/shared/project.js node --test tests/project-sdk.test.mjs`: PASS, 1 test, 0 skip (about 31.5 seconds).
- `node --test tests/workflow-operations.test.mjs tests/project.test.mjs e2b/tests/templates.test.mjs`: PASS, 28 tests, 0 skip.
- `git diff --check`: PASS.

## Source identity and remaining gate

T4 now checks out CLI `128f8dc6c71a9be9e28a9608e1e19f1b2e44a374` and Python SDK `2c7c4dd554d0623143b7e6277faf0019ca3138ee`. Template fixture remains explicitly pinned to `27f08af24a44732d9ffb0c97c33185eaf4dd3fad`, which includes the portable profile and prepared-image workflow consumed by this run. These are source pins, not completed backend receipts.

Real Docker/OpenSandbox T4 must rerun on the new provider commit. This local environment has no Docker daemon; no native pass is claimed. A same-repository PR synchronize event triggers the path-filtered workflow because its cumulative diff includes `opensandbox/**` and the workflow. Manual dispatch is also defined, but its resulting head SHA must be checked. The older Express canonical gate remains BLOCKED by its explicit authorization mechanism; no allowlist or credential changes were made.
