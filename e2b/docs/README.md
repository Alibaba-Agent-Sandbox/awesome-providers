# E2B

目录提供方，id 是 `e2b`，类型 `node`（`provider.mjs`，由宿主进程加载）。它用宿主内置的 E2B 协议类打 E2B 公开 API。CLI 和所有 SDK 都能用：CLI 直接运行，SDK 经由本机引擎（`abx provider engine serve`）。

总说明：[工作原理](../../docs/zh/principle.md) · [安装](../../docs/zh/install.md)

## 安装和调用

```bash
export ABX_E2B_API_KEY=REPLACE_ME
abx provider install alibaba-agent-sandbox/awesome-providers//e2b --allow-unpinned --yes   # 或 Python：python -m agent_sandbox.providers install registry:e2b --yes（索引上线后）
abx --provider e2b create --template base
```

```python
from agent_sandbox import Sandbox

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
| `code.interpret` | envd `POST /code.CodeInterpreter/Execute` |
| `ports.url` | 本地计算 `https://{port}-{sandboxID}.{domain}` |

## 会抛出 E8004 的调用

`files.transfer`、`templates.read`、`templates.build`、`ports.domain`、`storage.mount`、`network.vpc`、`sessions`。`pty` 也没有声明。

公开 envd 没有单独的 `/terminal`。交互终端要等进程 Start 的 `pty` 字段，所以这里不声明 `pty`。

没接、也不登记成扩展的接口：沙箱日志、指标、快照、fork、更新网络、卷、模板标签、团队密钥、事件和 webhook。

## 实测

单元测试在 `127.0.0.1` 上用假的 `POST /sandboxes`（`cli/tests/test_providers/test_node_plugins.test.ts`），不访问公网。真实调用只在设置了 `ABX_E2B_API_KEY` 时才有意义。这台环境没有这把密钥，所以真实创建没有执行。没有密钥时，测试确认创建在发请求前拒绝，并且极速版密钥不会被送出去。

## English

Catalog provider, id `e2b`, kind `node` (`provider.mjs`, loaded by the host). It uses the host's E2B protocol classes against the public E2B API and runs from the CLI and from every SDK (through the local engine, `abx provider engine serve`).

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
