# Provider acceptance / 提供方验收

The 2026-10-24 [three-consumer OpenSandbox check](../.agents/evidence/verify/2026-10-24-opensandbox-proxy-consumers-pass.md) covers default/direct, explicit portable/direct and default/server-proxy `python-hello` launches, with CLI/Python calls, independent Node HTTP calls through the proxy and cleanup. It used source-built candidates, not public npm/PyPI installation. The separate [public 92-case template matrix](https://github.com/Alibaba-Agent-Sandbox/awesome-templates/blob/78c30fbbd186cb59c3a0f0abd9fdf85b10c84b35/.agents/evidence/verify/2026-10-24-public-template-matrix.md) used CLI 0.4.16, host Python 0.3.1a5 and fixed provider/template checkouts on Express and default direct OpenSandbox. Neither result certifies real-model tasks, PTY, every cloud backend or the project unified interpreter.

2026-10-24 [OpenSandbox 三客户端测试](../.agents/evidence/verify/2026-10-24-opensandbox-proxy-consumers-pass.md)覆盖 `python-hello` 默认直连、显式 portable 直连及默认 server-proxy 启动，含 CLI/Python 调用、独立 Node HTTP 代理调用与清理；它使用源码构建的候选工具，不是公开包安装测试。另一次[公开 92 组模板矩阵](https://github.com/Alibaba-Agent-Sandbox/awesome-templates/blob/78c30fbbd186cb59c3a0f0abd9fdf85b10c84b35/.agents/evidence/verify/2026-10-24-public-template-matrix.md)使用 CLI 0.4.16、宿主 Python 0.3.1a5 和固定 provider/模板 checkout，覆盖极速版及默认直连 OpenSandbox。两者均不认证真实模型任务、PTY、所有云后端或项目统一解释器。

For new installations, install public CLI 0.5.5 with `npm install --global @agent-sandbox/cli@0.5.5 --registry=https://registry.npmjs.org` (Node.js 20+), or use the [official installation page](https://www.agent-sandbox.cn/start/) for standalone installation guidance. Use exact public Python client `0.4.0a6`. Install with `python -m pip install --index-url https://pypi.org/simple agent-sandbox-client==0.4.0a6`; this also installs its matching server dependency. Historical receipts below retain their actual tested versions; they are not installation recommendations or current-release certification.

新安装使用 `npm install --global @agent-sandbox/cli@0.5.5 --registry=https://registry.npmjs.org` 安装公开 CLI 0.5.5（Node.js 20+），独立二进制安装方法见[官网](https://www.agent-sandbox.cn/start/)。Python 使用公开 client `0.4.0a6`；使用 `python -m pip install --index-url https://pypi.org/simple agent-sandbox-client==0.4.0a6` 安装客户端及同版本服务端。下方历史收据保留实际测试身份，不再作为当前安装建议或新版测试证明。

| Provider | Stage / 状态 | Scope / 范围 |
| --- | --- | --- |
| Alibaba Cloud Express / 阿里云极速版 | Stable / 正式版 | Accepted host/cloud scope; see linked evidence and known limits. / 已验收范围及已知限制见下方证据。 |
| OpenSandbox | Accepted Docker scope / Docker 范围已验收 | Server 1.1.1 + pinned release-1.1.1 execd; CLI, Python SDK, project build/launch and cleanup. / CLI、Python SDK、项目构建启动与清理。 |
| E2B | Beta | Native cloud acceptance deferred. / 原生云端验收暂缓。 |
| CubeSandbox | Beta | Native backend acceptance deferred; PTY remains unsupported. / 原生后端验收暂缓，不支持 PTY。 |
| Alibaba Cloud Container / 阿里云容器版 | Beta | Native cluster acceptance deferred. / 原生集群验收暂缓。 |

`official` is a maintenance label; `builtin` describes packaging. Neither implies Stable. Capabilities, template prerequisites and stage are independent. Beta remains installable; its ID, consent, integrity checks, authentication and update behavior are unchanged.

`official` 表示维护来源，`builtin` 表示发布方式，均不等于正式验收。能力、模板前提和验收状态相互独立。Beta 仍可安装，提供方 ID、授权、完整性校验、认证与更新行为不变。

Express historical acceptance and limitations: [CLI](https://github.com/Alibaba-Agent-Sandbox/agent-sandbox/blob/main/.agents/evidence/verify/2026-10-18-provider-convergence-acceptance.md), [Python SDK](https://github.com/Alibaba-Agent-Sandbox/python-sdk/blob/main/.agents/evidence/verify/2026-10-18-provider-convergence-acceptance.md). These are dated records, not a claim that every upstream feature or image supports every operation.

极速版证据是特定日期、版本和范围的记录，并不承诺所有上游能力或所有镜像都支持每个操作。

Promotion requires real backend CLI/SDK tests covering the declared scope, cleanup evidence, reviewed limitations and maintainer approval. A mock, lifecycle health response, successful package installation, or a local subset never promotes a provider automatically. See [test tiers](e2e.md) and [catalog metadata](catalog-metadata.md).

升级为正式版需真实后端 CLI/SDK 声明范围测试、清理证据、限制审查和维护者批准。模拟测试、服务健康响应、安装成功或局部本机测试均不会自动升级。

OpenSandbox has a [verified Docker/CLI/Python SDK subset](../.agents/evidence/verify/2026-10-19-opensandbox-native-docker.md) with pinned versions and cleanup evidence. The maintainer accepted this scope on 2026-10-23; fresh native T4 with CLI 0.4.9 and the reviewed current SDK pins [passed](../.agents/evidence/verify/2026-10-23-opensandbox-native-promotion.md). Kubernetes, network-policy, secure-access and code-interpreter acceptance remain separate.

OpenSandbox 已完成[固定版本的 Docker、CLI 与 Python SDK 局部真实验证](../.agents/evidence/verify/2026-10-19-opensandbox-native-docker.md)，含清理证明；维护者于 2026-10-23 接受该范围。CLI 0.4.9 与当前 SDK 固定版本已重新[通过原生 T4](../.agents/evidence/verify/2026-10-23-opensandbox-native-promotion.md)。Kubernetes、网络策略、安全访问和代码解释器仍需独立验收。

The sites omit the maturity badge for accepted providers and mark only Beta. Machine-readable metadata retains `stable` / `beta`; per-template test coverage remains independent.

站点对已验收提供方不展示状态标签，仅标注 Beta。机器元数据仍使用 `stable` / `beta`，每个模板的测试覆盖单独判断。
