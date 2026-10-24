# E2B

**状态：Beta。** 本提供方暂未完成正式版验收。已声明的能力不等于已通过真实后端端到端测试；其他提供方的验收范围见[验收说明](../../docs/acceptance.md)。局部测试结果不会自动升级此状态。

目录提供方，id 是 `e2b`，类型 `node`（`provider.mjs`，由宿主进程加载）。它用宿主内置的 E2B 协议类打 E2B 公开 API。CLI 和 Python ProviderSandbox 可用：CLI 直接运行，Python 经由本机引擎（`abx provider engine serve`）。

总说明：[工作原理](../../docs/zh/principle.md) · [安装](../../docs/zh/install.md)

## 安装和调用

```bash
export ABX_E2B_API_KEY=REPLACE_ME
abx provider install alibaba-agent-sandbox/awesome-providers//e2b --allow-unpinned --yes   # 或 Python：python -m agent_sandbox.providers install registry:e2b --yes
abx --provider e2b create --template base
```

```python
from agent_sandbox import ProviderSandbox as Sandbox

sb = await Sandbox.create(provider="e2b", template="base", timeout=300)
```

没有 `ABX_E2B_API_KEY` 时，`Sandbox.create` 在发请求前抛 `InvalidAPIKeyError`。不读 `ABX_SANDBOX_API_KEY`，也不读 `E2B_API_KEY`。

## 配置

| 字段 | 环境变量 | 默认 |
|---|---|---|
| API 源站 | `ABX_E2B_BASE_URL` | `https://api.e2b.app` |
| 数据面域名 | `ABX_E2B_DOMAIN` | `e2b.app` |
| `X-API-Key` | `ABX_E2B_API_KEY` | 不设置 |

三个名字也可以放在 `provider_options` 里。`Sandbox.create(api_url=...)` 不会改这个源站，除非调用方把它抄进 `provider_options["base_url"]`。

数据面主机名是 `https://{port}-{sandboxID}.e2b.app`，envd 端口 49983。旧账号还在 `e2b.dev` 时，同时设置 `ABX_E2B_BASE_URL` 和 `ABX_E2B_DOMAIN`。创建响应里没有 `region` 时保持空字符串，不会落成 `cn-hangzhou`。

## 这个适配器会打的路径

| 能力 | 请求 |
|---|---|
| `sandbox.lifecycle` | `POST /sandboxes`（`templateID`、`timeout`、`metadata`、`envVars`）、`GET /sandboxes`、`GET /sandboxes/{id}`、`DELETE /sandboxes/{id}`、`GET /v2/sandboxes` |
| 连接暂停的沙箱 | 先 `POST /v2/sandboxes/{id}/connect`，再 `POST /sandboxes/{id}/connect`，4xx 再 GET |
| `sandbox.timeout` | `POST /sandboxes/{id}/timeout` |
| `sandbox.pause` | `POST /sandboxes/{id}/pause` 和 `POST /sandboxes/{id}/resume`。OpenAPI 把 `resume` 标了 deprecated；`pause()` 之后的 `resume()` 仍走那条路径 |
| `exec.run`、`exec.stream` | envd `POST /process.Process/Start`，`stdin: false` |
| `process.manage` | envd 的进程列表、标准输入和信号 |
| `files.rw` | envd 的读、写、列目录、移动和删除 |
| `files.watch` | envd `WatchDir`。事件形状 `{filesystem: {name, type}}` 会解析 |
| `ports.url` | 本地计算 `https://{port}-{sandboxID}.{domain}` |

## 会抛出 E8004 的调用

`files.transfer`、`templates.read`、`ports.domain`、`storage.mount`、`network.vpc`、`sessions`。`pty` 也没有声明。

公开 envd 没有单独的 `/terminal`。交互终端要等进程 Start 的 `pty` 字段，所以这里不声明 `pty`。

没接、也不登记成扩展的接口：沙箱日志、指标、快照、fork、更新网络、卷、模板标签、团队密钥、事件和 webhook。

## 实测

单元测试在 `127.0.0.1` 上用假的 `POST /sandboxes`（`cli/tests/test_providers/test_node_plugins.test.ts`），不访问公网。真实调用只在设置了 `ABX_E2B_API_KEY` 时才有意义。这台环境没有这把密钥，所以真实创建没有执行。没有密钥时，测试确认创建在发请求前拒绝，并且极速版密钥不会被送出去。

## 镜像转模板适配器（待宿主接线）

适配器接受已推送、后端可拉取的镜像，不读取本地文件、不调用 Docker、不上传到 ACR。输入合同：

```js
await adapter.deploy({
  source: { kind: "image", image: "docker.io/example/runtime:v1" },
  name: "runtime:v1",
  spec: { cpu: 2, memory: 2048,
    start_cmd: "python3 /app/server.py", ready_cmd: "curl -f http://localhost:9000/health" },
  timeout: 600, // 整个构建等待时间（秒）；最多 3600
  // registry: { username, password }, // 私有镜像才提供，不能写入日志
  // signal: abortController.signal,
});
// { template_id, build_id, status: "ready", ref: image }
```

`spec` 字段均可省略，CPU 为整数核数，内存单位 MB。`start_cmd` 必须同时提供 `ready_cmd`；仅提供 `ready_cmd` 也可用。其他 spec 字段、Dockerfile、构建步骤和文件上下文会在发请求前拒绝，不会静默丢弃。私有仓库用户名与密码必须成对提供。SDK 的 API key、API origin 和 domain 全部显式使用本 provider 的配置；不采用 `E2B_*`、Express 或 SDK debug 环境默认。不会输出 SDK 原始日志或错误正文，错误只保留可验证的 HTTP 状态。超时或取消停止等待与网络请求；远端已经提交的构建可能仍存在，不会擅自删除模板。

镜像部署功能的兼容性基线是 Node 22+ 和官方 `e2b@2.55.0`，由支持此合同的新版宿主安装并注入，不在插件加载时安装包。这不是已发布版本声明。虽然 SDK 顶层元数据声称支持部分 Node 20 版本，它静态导入的 `@e2b/dockerfile-utils@0.1.1` 要求 Node 22+，因此本功能不承诺 Node 20 支持；CLI 的常规 Node 20 支持与此功能分开。使用 SDK 的 `Template().fromImage(...)`、可选 `setStartCmd(...)` / `setReadyCmd(...)` 和 `Template.build(...)`，后者成功返回后才报告 ready。SDK 真实 HTTP 路径已用 loopback 验证为 `POST /v3/templates`、`POST /v2/templates/{templateID}/builds/{buildID}`、`GET /templates/{templateID}/builds/{buildID}/status`。旧的 `POST /templates`、`POST /v2/templates` 不应作为回退路径。

```bash
cd e2b
node tests/run.mjs
# 可选：将路径改为宿主安装的官方 e2b@2.55.0
E2B_TEMPLATE_SDK_MODULE=file:///absolute/path/to/e2b/dist/index.mjs node tests/run.mjs
```

2026-10-16：适配器 T0 单元测试及官方 SDK 对 loopback 假后端的完整构建协议测试已执行。没有授权的 `ABX_E2B_API_KEY`，因此 E2B 实云构建、创建、执行和清理均未执行。根配置的通用 `E2B_*` 指向另一家后端，不能当作 E2B 账号使用。此结果不构成 T4 实云通过，也不证明镜像已在 E2B 上运行。

官方依据：[Template quickstart](https://docs.e2b.dev/template/quickstart)、[Base image / registry credentials](https://docs.e2b.dev/template/base-image)、[SDK releases](https://github.com/e2b-dev/E2B/releases)。

## English

Catalog provider, id `e2b`, kind `node` (`provider.mjs`, loaded by the host). It uses the host's E2B protocol classes against the public E2B API and runs from the CLI and from Python ProviderSandbox (through the local engine, `abx provider engine serve`).

```bash
export ABX_E2B_API_KEY=REPLACE_ME
abx provider install alibaba-agent-sandbox/awesome-providers//e2b --allow-unpinned --yes   # or, Python only once the index is live: python -m agent_sandbox.providers install registry:e2b --yes
```

| Field | Environment | Default |
|---|---|---|
| API origin | `ABX_E2B_BASE_URL` | `https://api.e2b.app` |
| Data-plane domain | `ABX_E2B_DOMAIN` | `e2b.app` |
| `X-API-Key` | `ABX_E2B_API_KEY` | unset |

Missing `ABX_E2B_API_KEY` raises `InvalidAPIKeyError` before any request. It does not read `ABX_SANDBOX_API_KEY` or `E2B_API_KEY`. An old account on `e2b.dev` sets both `ABX_E2B_BASE_URL` and `ABX_E2B_DOMAIN`.

Connect tries `POST /v2/sandboxes/{id}/connect`, then `POST /sandboxes/{id}/connect`, then GET. Process Start sends `stdin: false`. `files.watch` is declared. `pty` is not declared because public envd has no `/terminal`.

Unit tests use a local fake API. A live create needs `ABX_E2B_API_KEY`. This environment does not have that key.

## 自动准备项目（Beta） / Automatic project preparation (Beta)

使用包含 `template launch` 和 `kit.project` 的 CLI 源码版，安装或更新本插件后运行：

```sh
abx --provider e2b template launch alibaba-agent-sandbox/awesome-templates//python-hello --yes
```

提供方现在声明 `templates.build`，用于 node/1 管理器的 `prepareProject`。CLI 自动把适配器返回的 ID、名称或镜像传给创建，启动服务并验证就绪；缺少模板声明的运行时能力时，在构建前拒绝。正常沙箱行为不变。

Use a CLI source build containing `template launch` and `kit.project`. The node/1 `prepareProject` manager is guarded by `templates.build`. The exact returned native reference is handed to sandbox creation. Missing runtime capabilities fail before build. Normal sandbox operations remain unchanged.

配置独立的 `ABX_E2B_API_KEY`，Node 22+ 与可选官方 SDK。显式选择源码中经审查的构建方案，基础镜像须提供所需原生运行时；不会改写 FROM 占位符。无需本机 Docker/仓库：适配器在临时副本上解析 Dockerfile，调用固定版本官方 SDK 构建并等待就绪，返回真实模板 ID。

Configure the independent E2B key, Node 22+ and optional official SDK. Explicitly select a reviewed source build profile with the required native runtime; unresolved FROM placeholders are never rewritten. No local Docker/registry is needed. Staged Dockerfile parsing and official SDK building return the actual ready template ID.

所有新路径保持 Beta；原生 E2B、Cube、集群验收仍按维护者要求暂缓。单元/回环/实际 SDK 测试不能当成云验收。临时目录会清理；成功沙箱、镜像和已登记模板不会自动删除，可能继续计费。准备超时可能遗留已提交产物，启动/就绪失败会尝试删除本次新建沙箱并报告清理状态。源码安装、引用契约及完整限制见[指南](https://github.com/Alibaba-Agent-Sandbox/agent-sandbox/blob/main/docs/zh/guide/template-launch.md)。

All new paths remain Beta. Native E2B/Cube/cluster acceptance is explicitly deferred by the maintainer; unit/loopback/official SDK protocol tests are not cloud acceptance. Temporary staging is cleaned. Successful sandboxes, images and registered templates are retained and may incur cost. Preparation timeout may leave submitted artifacts; startup/readiness failure attempts cleanup of this invocation's new sandbox. See the [host guide](https://github.com/Alibaba-Agent-Sandbox/agent-sandbox/blob/main/docs/en/guide/template-launch.md) for installation, reference contracts and limits.

## Explicit workflow contract / 显式工作流契约

See [operation declarations](../../docs/workflows.md) ([中文](../../docs/workflows.zh-CN.md)). CLI and Python declare separate operations; Python does not prepare source. Preparation preserves the Dockerfile and requires a persistent ownership journal. Retained artifacts requiring manual cleanup are reported as residuals. Historical backend checks do not certify the new workflow path.

参见精确操作声明。CLI 与 Python 分开声明；Python 不准备源码。准备阶段保留 Dockerfile 并持久记录资源意图，需人工清理的产物明确列为残留；旧后端记录不认证新工作流。

项目 CLI/Python Provider 目前未接入 E2B 原生解释器；所有 `code.*` 操作均不声明并在发送代码前返回 E8004。平台自己的标准 SDK 支持属于独立契约。

The project CLI/Python Provider has no verified E2B interpreter adapter. It declares no `code.*` operations and rejects code before I/O. The platform's standard SDK remains a separate contract.
