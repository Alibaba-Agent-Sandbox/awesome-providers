# E2B

目录提供方，id 是 `e2b`。安装之后由 Python SDK 加载。CLI 不加载 `kind = "python"`。它用和 `rest` 提供方同一套 HTTP 客户端打 E2B 公开 API，不启动 Node 插件。

总说明：[工作原理](../../docs/zh/principle.md) · [安装](../../docs/zh/install.md)

## 安装和调用

```bash
export ABX_E2B_API_KEY=REPLACE_ME
python -m agent_sandbox.providers install registry:e2b --yes
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

`pty`、`files.transfer`、`templates.read`、`templates.build`、`ports.domain`、`storage.mount`、`network.vpc`、`sessions`。

公开 envd 没有单独的 `/terminal`。交互终端要等进程 Start 的 `pty` 字段，不要把 `get_terminal` 改成静默成功。

没接、也不登记成扩展的接口：沙箱日志、指标、快照、fork、更新网络、卷、模板标签、团队密钥、事件和 webhook。

## 实测

单元测试在 `127.0.0.1` 上用假的 `POST /sandboxes`，不访问公网。`e2e/test_08_providers.py` 只在设置了 `ABX_E2B_API_KEY` 时访问 E2B。这台环境没有这把密钥，所以真实创建没有执行。没有密钥时，测试确认创建在发请求前拒绝，并且极速版密钥不会被送出去。

## English

Catalog provider, id `e2b`. After install, the Python SDK loads it. The CLI does not load `kind = "python"`. It uses the same HTTP client as a `rest` provider against the public E2B API.

```bash
export ABX_E2B_API_KEY=REPLACE_ME
python -m agent_sandbox.providers install registry:e2b --yes
```

| Field | Environment | Default |
|---|---|---|
| API origin | `ABX_E2B_BASE_URL` | `https://api.e2b.app` |
| Data-plane domain | `ABX_E2B_DOMAIN` | `e2b.app` |
| `X-API-Key` | `ABX_E2B_API_KEY` | unset |

Missing `ABX_E2B_API_KEY` raises `InvalidAPIKeyError` before any request. It does not read `ABX_SANDBOX_API_KEY` or `E2B_API_KEY`. An old account on `e2b.dev` sets both `ABX_E2B_BASE_URL` and `ABX_E2B_DOMAIN`.

Connect tries `POST /v2/sandboxes/{id}/connect`, then `POST /sandboxes/{id}/connect`, then GET. Process Start sends `stdin: false`. `files.watch` is declared. `get_terminal` is `E8004` because public envd has no `/terminal`.

Unit tests use a local fake API. Live create runs only when `ABX_E2B_API_KEY` is set. This environment does not have that key.
