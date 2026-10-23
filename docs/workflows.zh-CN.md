# Provider 精确工作流操作

平台有某种运行时，不代表项目 adapter 或语言桥接已接入。模板软件、平台操作和客户端接口分别声明。[English](workflows.md)。

每个插件声明 `operation_contract_version = 1`、`[operations] cli/python` 和 `[workflow] inputs/startups`；Node infrastructure 或 EPP initialize 返回相同信息。声明必须有真实消费入口 handler。[共享 IDL](https://github.com/Alibaba-Agent-Sandbox/python-sdk/tree/main/contracts) 归 Python SDK 契约维护。粗粒度 features 仅用于发现，不承诺解释器语义。

| 提供方 | CLI 代码操作 | Python 代码操作 | 源码准备 |
| --- | --- | --- | --- |
| OpenSandbox | 尚未适配 | 尚未适配 | 保留 Dockerfile 构建推送，返回 OCI 镜像 |
| E2B | 尚未适配 | 尚未适配 | 官方 Template SDK 注册 |
| CubeSandbox | 仅持久默认上下文执行 | 相同缓冲操作 | 镜像与原生 Cube 注册 |
| 阿里云容器版 | 仅持久默认上下文执行 | 相同缓冲操作 | 镜像与自有 SandboxSet 注册 |

`code.execute` 必须提供无状态执行。已删除的猜测 Connect RPC 不构成实现；Express、REST 预设与此 E2B adapter 均不声明项目解释器操作。持久默认上下文显式选择 `code.default-context.execute`。Cube/容器版 POST `/execute` 不宣称无状态。不支持时在发送 payload 前拒绝 context 参数和实时流回调；缓冲响应不能承诺 `code.stream`，HTTP404 不能降级 shell。

Python Provider 只消费显式准备的镜像或托管引用，不声明 `template.prepare`。E2B/Cube/容器版不能把 OCI 镜像当原生模板 ID。OpenSandbox 支持镜像，但不宣称执行镜像原生 ENTRYPOINT；平台 API 要求显式进程，可见 keepalive 默认是 `tail -f /dev/null`。解释器脚本必须显式配置，不根据镜像名推断。

准备保留 Dockerfile 的 FROM、USER、COPY、ENTRYPOINT；删除 `build_base_image` 且无兼容回退。占位符未显式解析时检查失败。`startup: exec` 只由 launcher 启动一次，不重复注入为平台启动命令。应用部署 hooks 独立。

构建、推送和注册需要持久 ownership journal；请求前记 intent，响应后记返回 ID。未知响应不盲重试。`owned_resources` 只列本轮新建资源，复用项和共享 base 不算新拥有。没有删除协议的产物需人工清理，调用方必须报告残留及恢复方式，不能宣称完全清理。

OpenSandbox 端点包含 provider/sandbox/port 身份、网关认证受众、代理路径模式和可选有效期。拼接保留路径前缀及查询参数，拒绝 URL userinfo 和自动重定向。操作级签名端点缺少相应 signer 时在 payload 前拒绝；非幂等 execd 请求在网络响应不明时不重放。

本变更不认证新后端路径。T0/mock、原生 SDK、guest、bridge、host CLI、Python Provider 证据各自独立。仅完整、输入匹配且来源独立可信的 CI 收据可认证项目路径。历史记录和 Beta 成熟度保留原范围。
