# Explicit application endpoints for node adapters

Result: PARTIAL

Date: 2026-10-23. Scope: Cube, container and E2B adapter application-port bindings after the normal main merge.

## Problem and correction

A Cube `portUrl` returns HTTP virtual-host addressing and gateway headers, while generic synchronous port addressing could derive HTTPS from the sandbox secure flag. That fallback changed the adapter's real application binding. The same implicit path could discard container private prefixes or gateway authentication.

Each owning adapter now exposes `portEndpoint` with exact provider/sandbox/port identity, adapter-owned URL and minimal gateway headers, gateway authentication audience and explicit prefix path semantics. Cube retains HTTP and the reported domain; container retains native HTTPS or its private `/kruise/<id>/<port>` path; E2B explicitly resolves its current gateway access token and domain. No control-plane key is included. The host does not infer descriptors from a legacy tuple.

## Verification

PASS: `node --test tests/project.test.mjs tests/workflow-operations.test.mjs`: 16 tests, zero skips. New regressions exercise Cube HTTP versus secure-default HTTPS, reported domain and sandbox gateway token; container native and private paths; E2B reported domain; complete binding identity and exclusion of the control-plane credential.

No real backend resources were created. These adapter tests are not a live Cube/container/E2B acceptance or a promotion of the new template workflow. Current-head host integration and exact-producer OpenSandbox T4 remain coordinated separately.

[Owner Issue](https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues/23).
