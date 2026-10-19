# 阿里云智能体沙箱容器版

**状态：Beta。** 本提供方暂未完成正式版验收。已声明的能力不等于已通过真实后端端到端测试；当前仅阿里云极速版为正式版。局部测试结果不会自动升级此状态。

目录提供方，id 是 `alicloud-container`。这不是极速版 `alicloud-express`。它是 ACS 或 ACK 上的 OpenKruise Agents sandbox-manager，说的是 E2B 形状的 HTTP。类型 `node`（`provider.mjs`，由宿主进程加载）。CLI 和所有 SDK 都能用：CLI 直接运行，SDK 经由本机引擎（`abx provider engine serve`）。

总说明：[工作原理](../../docs/zh/principle.md) · [安装](../../docs/zh/install.md)

## 安装和调用

```bash
export ABX_ALICLOUD_CONTAINER_DOMAIN=sbx.example.com
export ABX_ALICLOUD_CONTAINER_API_KEY=REPLACE_ME
abx provider install alibaba-agent-sandbox/awesome-providers//alicloud-container --allow-unpinned --yes   # 或 Python：python -m agent_sandbox.providers install registry:alicloud-container --yes（索引上线后）
abx --provider alicloud-container create --template code-interpreter
```

```python
from agent_sandbox import Sandbox

sb = await Sandbox.create(
    provider="alicloud-container",
    template="code-interpreter",
    provider_options={
        "domain": "sbx.example.com",
        "api_key": "REPLACE_ME",
        "protocol": "native",
    },
)
```

模板 id 按集群里的镜像。文档示例是 `code-interpreter`，不是极速版的 `base`。

## 配置

| 项 | 环境变量 | 说明 |
|---|---|---|
| 域名 | `ABX_ALICLOUD_CONTAINER_DOMAIN` | 必填，除非 `base_url` 已经给了源站 |
| API 源站 | `ABX_ALICLOUD_CONTAINER_BASE_URL` | 可省略 |
| API Key | `ABX_ALICLOUD_CONTAINER_API_KEY` | 请求头 `X-API-Key`。不读 `ABX_SANDBOX_API_KEY` |
| 协议 | `ABX_ALICLOUD_CONTAINER_PROTOCOL` | `native`（默认）或 `private` |

`native`：API 是 `https://api.{domain}`，数据面是 `https://{port}-{id}.{domain}`。创建响应里没有 `envdUrl` 时，适配器补 `https://49983-{id}.{domain}`。集群的 envd 端口如果不是 49983，命令会连错主机。

`private`：API 是 `https://{domain}/kruise/api`，数据面是 `https://{domain}/kruise/{id}/49983`，端口 URL 是 `https://{domain}/kruise/{id}/{port}`。

## 这个适配器会打的路径

| 能力 | 请求 |
|---|---|
| `sandbox.lifecycle` | `POST /sandboxes`、查询、列表、`DELETE`。`connect` 先 POST，4xx 再 GET。列表也会打 `GET /v2/sandboxes` |
| `sandbox.timeout` | `POST /sandboxes/{id}/timeout` |
| `sandbox.pause` | `POST /sandboxes/{id}/pause` 和 `POST /sandboxes/{id}/resume` |
| `exec.run`、`exec.stream` | envd `POST /process.Process/Start`，`stdin: false` |
| `process.manage` | envd 的进程列表、标准输入和信号 |
| `files.rw` | envd 的读、写、列目录、移动和删除 |
| `code.interpret` | Jupyter `POST /execute`，端口 49999，读 ndjson。不是 envd 的 CodeInterpreter RPC |
| `ports.url` | 按上面的 native 或 private 规则在本地计算 |

## 会抛出 E8004 的调用

`files.watch`、`files.transfer`、`templates.read`、`templates.build`、`ports.domain`、`storage.mount`、`network.vpc`、`sessions`。

sandbox-manager 没有 `/terminal`。PTY 要走带 `pty` 字段的进程启动，这个适配器还没接，所以清单不声明 `pty`。官方说明里，预签名上传下载、日志、指标和卷也不在容器版的 E2B 兼容范围内。

## 实测

单元测试打的是本机假 API（`cli/tests/test_providers/test_node_plugins.test.ts`）。真实 sandbox-manager 需要同时设置 `ABX_ALICLOUD_CONTAINER_DOMAIN` 和 `ABX_ALICLOUD_CONTAINER_API_KEY`。这台环境没有 ACS/ACK 集群，所以真实创建没有执行。没有这两项时，测试只确认适配器在发请求前拒绝，不会把极速版密钥发出去。

## English

Catalog provider, id `alicloud-container`. This is the ACS/ACK OpenKruise Agents sandbox-manager, not Express (`alicloud-express`). Kind `node` (`provider.mjs`, loaded by the host). It runs from the CLI and from every SDK (through the local engine, `abx provider engine serve`).

```bash
export ABX_ALICLOUD_CONTAINER_DOMAIN=sbx.example.com
export ABX_ALICLOUD_CONTAINER_API_KEY=REPLACE_ME
abx provider install alibaba-agent-sandbox/awesome-providers//alicloud-container --allow-unpinned --yes   # or, Python only once the index is live: python -m agent_sandbox.providers install registry:alicloud-container --yes
```

| Setting | Environment |
|---|---|
| Domain | `ABX_ALICLOUD_CONTAINER_DOMAIN` |
| API origin, optional | `ABX_ALICLOUD_CONTAINER_BASE_URL` |
| API key, header `X-API-Key` | `ABX_ALICLOUD_CONTAINER_API_KEY` |
| `native` or `private` | `ABX_ALICLOUD_CONTAINER_PROTOCOL`, default `native` |

`native` uses `https://api.{domain}` and `https://{port}-{id}.{domain}`. `private` uses `https://{domain}/kruise/api` and `https://{domain}/kruise/{id}/49983`. It does not read `ABX_SANDBOX_API_KEY`.

Declared: `sandbox.lifecycle`, `sandbox.timeout`, `sandbox.pause`, `exec.run`, `exec.stream`, `process.manage`, `files.rw`, `code.interpret`, `ports.url`. `run_code` is Jupyter `POST /execute` on port 49999. `pty` is not declared; sandbox-manager has no `/terminal`.

Unit tests use a local fake API. A live create needs both the domain and the API key. This environment has no ACS/ACK cluster, so that create did not run. The example template id is `code-interpreter`, not Express `base`.
