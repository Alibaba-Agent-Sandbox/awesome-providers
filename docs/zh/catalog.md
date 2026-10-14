# 目录里的提供方

索引是仓库根上的 `index.json`。公开地址是 `https://registry.agent-sandbox.cn/providers/index.json`。

给人看的注册站是 <https://registry.agent-sandbox.com>。官网是 <https://www.agent-sandbox.com>。安装器仍然拉取上面的索引地址。

| Id | 文档 | 后端 | 2026-10-14 的结论 |
|---|---|---|---|
| `opensandbox` | [docs](../../opensandbox/docs/README.md) | 本机 OpenSandbox，默认 `http://127.0.0.1:8080` | 创建、命令、文件、端口、暂停、终端已在本机 OpenSandbox 上跑通 |
| `cubesandbox` | [docs](../../cubesandbox/docs/README.md) | CubeAPI，默认 `http://127.0.0.1:3000` | 路径已对照当前 Cube SDK 和 OpenAPI。这台环境没有 Cube 集群，真实创建没有跑 |
| `e2b` | [docs](../../e2b/docs/README.md) | `https://api.e2b.app` | HTTP 形状已对照当前 E2B API。没有 `ABX_E2B_API_KEY`，真实创建没有跑 |
| `alicloud-container` | [docs](../../alicloud-container/docs/README.md) | ACS/ACK sandbox-manager | native / private 两条 URL 已接上。没有集群域名和密钥，真实创建没有跑 |

四个都用 `abx provider install registry:<id> --yes`（或 `python -m agent_sandbox.providers install registry:<id> --yes`）安装。都不要读极速版的 `ABX_SANDBOX_API_KEY`。

## 审查时改过的行为

这些是对照官方 SDK / OpenAPI 之后改的。单元测试锁的是新行为。没有真实后端的三项，逻辑上可以发请求，但是还没在目标环境里看过响应。

| 问题 | 现在 |
|---|---|
| E2B 默认域名曾经是 `e2b.dev` | 默认 `https://api.e2b.app` 和 `e2b.app`。旧账号用环境变量指回去 |
| Cube 默认域名曾经是 `localhost` | 默认 `cube.app`。数据面是 `http://49983-{id}.{domain}`，不走 443 |
| `connect` 只发 GET | E2B、Cube、容器版都先 `POST /sandboxes/{id}/connect`（E2B 还有 `/v2/.../connect`），4xx 再 GET |
| Cube 进程和文件不带用户 | 默认 `user` / `username` 为 `root`，并带 `Authorization: Basic` |
| Cube 创建响应没有 `envdAccessToken` | 不发 `X-Access-Token`，也不在发请求前抛 `TokenExpiredError` |
| Cube `resume` 没有 JSON 正文 | `POST /resume` 发送 `{}` |
| Cube 和容器版的 `run_code` 打到 envd CodeInterpreter | 改打 Jupyter `POST /execute`（端口 49999），读 ndjson |
| Cube envd 把裸 JSON 的前 5 个字节当帧头 | Cube 的 envd 请求加 5 字节 Connect 帧和 `Connect-Protocol-Version: 1` |
| 进程 Start 不带 `stdin` | 共享的进程协议现在带 `stdin: false`，避免 `cat` 一直等到 HTTP 超时 |
| `state: pausing` | `SandboxStatus` 接受 `pausing` |

## 拿到环境后还要看的

| 提供方 | 调用 | 要确认的事 |
|---|---|---|
| Cube | `run_code` 两次，第二次读第一次的变量 | Jupyter 是否把状态留在同一次 `/execute` 之外 |
| Cube | 客户端不在节点上 | `ABX_CUBESANDBOX_PROXY=主机:80`。TCP 打到代理，Host 仍是虚拟主机名 |
| Cube | `Sandbox.list(status=...)` | `GET /sandboxes` 忽略 `status` 和 `offset`。过滤要等改打 `GET /v2/sandboxes` |
| E2B | `Sandbox.connect` 到暂停的沙箱 | 应先打到 `POST /connect` 并恢复。`pause()` 之后的 `resume()` 仍走 OpenAPI 里标了 deprecated 的 `POST /resume` |
| E2B、容器版 | `get_terminal` | 未声明，`E8004`。公开 envd 用进程 Start 的 `pty` 字段，不是 WebSocket `/terminal` |
| 容器版 native | 创建响应里没有 `envdUrl` | 补 `https://49983-{id}.{domain}`。集群 envd 端口如果不是 49983，命令会连错主机 |
| 容器版 private | 创建 | 数据面是 `https://{domain}/kruise/{id}/49983`，端口 URL 是 `https://{domain}/kruise/{id}/{port}` |

离线测试：`cli/tests/test_providers/test_node_plugins.test.ts`（三个 `node` 插件对 E2B 形状的 mock，包括 Connect 信封、代理拨号、可选令牌和终端）、`cli/tests/test_engine/test_engine.test.ts`（引擎）、`opensandbox/tests`（OpenSandbox 插件）以及 `python-sdk/client-sdk/tests/test_providers/test_engine_provider.py`（Python SDK 到引擎到插件到 mock）。本机 `127.0.0.1:8080` 有 OpenSandbox 服务时，CLI 测试和 Python 也会对它做真实调用。缺密钥或后端时对应测试跳过，不会把另一家的密钥发出去。
