# Exact provider workflow operations

A platform may provide a runtime that this project's adapter or a language bridge does not implement. Template software, platform operations and client interfaces are separate contracts. [中文](workflows.zh-CN.md).

Every plugin declares `operation_contract_version = 1`, `[operations] cli/python`, and `[workflow] inputs/startups`. Runtime Node infrastructure or EPP initialization reports the same declarations. A declaration without an actual consumer handler is invalid. The shared operation IDL belongs to the [Python SDK contracts](https://github.com/Alibaba-Agent-Sandbox/python-sdk/tree/main/contracts); coarse features remain discovery metadata and cannot promise interpreter behavior.

| Provider | CLI code operations | Python code operations | Source preparation |
| --- | --- | --- | --- |
| OpenSandbox | Not adapted | Not adapted | Explicit Dockerfile build/push; OCI image reference |
| E2B | Not adapted | Not adapted | Official Template SDK registration |
| CubeSandbox | Persistent default-context execute only | Same buffered operation | OCI image plus native Cube registration |
| Alibaba Cloud Container | Persistent default-context execute only | Same buffered operation | OCI image plus owned SandboxSet registration |

`code.execute` requires stateless execution. The removed guessed Connect RPC was not an implementation: Express, REST presets and this E2B adapter declare no project interpreter operations. Persistent default execution explicitly selects `code.default-context.execute`. Cube/container POST `/execute` is not claimed as stateless. Context parameters and callbacks for real-time streaming are refused before sending a payload where unsupported. No adapter promises `code.stream` from a buffered response, and no HTTP404 falls back to shell execution.

Python Provider consumes an explicitly prepared image or managed reference; it does not claim `template.prepare`. E2B/Cube/container do not accept raw image IDs as native managed template IDs. OpenSandbox accepts images but does not claim native image ENTRYPOINT startup. Its lifecycle API requires an explicit process: the visible keepalive default is `tail -f /dev/null`; custom interpreter scripts require explicit configuration and are never inferred from an image name.

Preparation preserves Dockerfile FROM, USER, COPY and ENTRYPOINT. The removed `build_base_image` setting has no compatibility fallback. Select a reviewed, explicit source/profile before planning; unresolved placeholders fail preflight. `startup: exec` belongs to the launcher and is not also injected as native template startup. Application deployment hooks are independent.

A persistent ownership journal is required before build/push/registration. Requests record intent first and returned IDs afterward. Unknown responses do not trigger blind registration retries. Returned `owned_resources` include only resources created by this invocation; reused resources and shared bases are not newly owned. Native artifact deletion is currently manual where no delete protocol exists: callers must report retained resources and recovery instructions, not complete cleanup.

OpenSandbox port endpoints include provider/sandbox/port identity, gateway authentication audience, proxy path mode and optional expiry. Proxy prefixes and queries are preserved; URL userinfo and automatic redirects are rejected. An operation-signed endpoint without an operation-specific signing adapter is refused before payload execution. Non-idempotent execd requests are not replayed after uncertain network responses.

These changes do not certify any new backend workflow. T0/mock, native SDK, guest, bridge, host CLI and Python Provider evidence remain distinct. Only complete input-matching receipts from independently trusted CI can certify a project path. Historical backend records and Beta maturity retain their original scope.
