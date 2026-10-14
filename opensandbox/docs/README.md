# OpenSandbox

目录提供方，id 是 `opensandbox`。不是随 SDK 编译进去的。类型 `node`：一个 ES 模块（`provider.mjs`，无 npm 依赖），导出 `create(kit)`，宿主在进程内调用它的 EPP/1 方法（`kit.epp.infra`）。CLI 直接使用它，Python 以及之后的 Node、Go、Java SDK 通过本机引擎（`abx provider engine serve`）使用它。`node provider.mjs` 仍可在 stdio 上提供 EPP/1，供其他宿主使用。需要 `node` 在 `PATH` 里。

总说明：[工作原理](../../docs/zh/principle.md) · [安装](../../docs/zh/install.md)

## 安装和调用

```bash
abx provider install alibaba-agent-sandbox/awesome-providers//opensandbox --allow-unpinned --yes   # 或 Python：python -m agent_sandbox.providers install registry:opensandbox --yes（索引上线后）
abx --provider opensandbox create
```

```python
from agent_sandbox import Sandbox

sb = await Sandbox.create(provider="opensandbox", template="base", timeout=300)
print((await sb.commands.run("echo ok", timeout=30)).stdout)
await sb.kill()
```

`template="base"` 使用镜像 `python:3.12-slim`，入口是 `tail -f /dev/null`。带 `:` 或 `/` 的模板名按镜像 URI 使用。

## 配置

| 项 | 环境变量 | 默认 |
|---|---|---|
| 生命周期地址，不带 `/v1` | `ABX_OPENSANDBOX_BASE_URL`，别名 `OPENSANDBOX_BASE_URL` | `http://127.0.0.1:8080` |
| 请求头 `OPEN-SANDBOX-API-KEY` | `ABX_OPENSANDBOX_API_KEY`，别名 `OPEN_SANDBOX_API_KEY`、`OPENSANDBOX_API_KEY` | 不设置 |

也可以放在 `provider_options` 里。清单继承了 `sandbox_api_key` 和 `sandbox_base_url`，但适配器只有在通用键的值和 `ABX_SANDBOX_API_KEY` 不同时才采用它。极速版密钥不会被送去。

## 请求留在插件进程

插件模块（在宿主进程内）直接打 OpenSandbox 的 HTTP（生命周期）和 execd（命令的 SSE、文件、终端的 WebSocket）。终端需要 Node 22+ 的全局 `WebSocket`。另一个解释器里的 `Sandbox.connect` 会再向生命周期 API 取 execd 地址，然后执行命令；不依赖创建进程留在内存里的会话。

| 能力 | 引擎对后端 |
|---|---|
| `sandbox.lifecycle` | `POST` / `GET` / `DELETE /v1/sandboxes` |
| `sandbox.timeout` | `POST /v1/sandboxes/{id}/renew-expiration` |
| `sandbox.pause` | `POST …/pause` 和 `…/resume` |
| `exec.run`、`exec.stream` | execd `POST /command`（SSE） |
| `process.manage` | 没有进程接口。列表读 `/proc`，信号用 `kill`。`commands.send_input` 是 `E8004` |
| `pty` | `POST /pty`，WebSocket `/pty/{id}/ws` |
| `files.rw` | execd `/files` 和 `/directories` |
| `ports.url` | `GET /v1/sandboxes/{id}/endpoints/{port}` |

## 会抛出 E8004 的调用

`files.watch`、`files.transfer`、`templates.read`、`templates.build`、`ports.domain`、`storage.mount`、`network.vpc`、`sessions`、`code.interpret`。

`POST /code` 只有带 Jupyter 的 code-interpreter 镜像才有。默认的 `python:3.12-slim` 没有，所以代码解释器不声明。`POST /session` 那种有状态 shell 也没接。

## 实测

2026-10-14，本机 OpenSandbox 1.1.1（`127.0.0.1:8080`，Docker，`opensandbox/execd:latest`）：创建、列表、删除、续期、暂停后恢复、命令、流式输出、`/proc` 进程列表、终端 `echo $((40+2))`、文件往返、端口 URL 都有真实返回。另一个解释器里的 `Sandbox.connect` 再执行 `echo fresh-exec-ok` 也返回了。同一天的能力对照表在 SDK 文档 `python-sdk/docs/zh/design/provider-opensandbox-mapping.md`。

## English

Catalog provider, id `opensandbox`, kind `node`: an ES module (`provider.mjs`, no npm dependencies) that exports `create(kit)`; the host calls its EPP/1 methods in process (`kit.epp.infra`). The CLI uses it directly; the Python SDK and the Node, Go and Java SDKs use it through the local engine (`abx provider engine serve`). `node provider.mjs` still serves EPP/1 on stdio for other hosts. `node` must be on `PATH`.

```bash
abx provider install alibaba-agent-sandbox/awesome-providers//opensandbox --allow-unpinned --yes   # or, Python only once the index is live: python -m agent_sandbox.providers install registry:opensandbox --yes
```

`template="base"` is the image `python:3.12-slim` with entrypoint `tail -f /dev/null`. A template name that contains `:` or `/` is used as an image URI.

| Setting | Environment | Default |
|---|---|---|
| Lifecycle origin, no `/v1` | `ABX_OPENSANDBOX_BASE_URL`, also `OPENSANDBOX_BASE_URL` | `http://127.0.0.1:8080` |
| Header `OPEN-SANDBOX-API-KEY` | `ABX_OPENSANDBOX_API_KEY`, also `OPEN_SANDBOX_API_KEY`, `OPENSANDBOX_API_KEY` | unset |

The plugin module (in the host process) talks to the OpenSandbox lifecycle API and to each sandbox's execd (command SSE, files, the terminal WebSocket). The terminal needs the global `WebSocket` of Node 22+. `Sandbox.connect` in a second interpreter asks the lifecycle API for the execd address and can run a command; it does not need the session object kept by the process that created the sandbox.

Declared: `sandbox.lifecycle`, `sandbox.timeout`, `sandbox.pause`, `exec.run`, `exec.stream`, `process.manage`, `pty`, `files.rw`, `ports.url`. `commands.send_input` is `E8004` because `/command` has no stdin. `code.interpret` is `E8004` because `POST /code` exists only on a Jupyter image.

On 2026-10-14 a local OpenSandbox 1.1.1 returned real results for create, list, kill, renew, pause/resume, exec, streaming, a `/proc` process list, a PTY `echo`, a file round-trip, and a port URL. `Sandbox.connect` in a second interpreter also ran `echo fresh-exec-ok`. The capability table is `python-sdk/docs/en/design/provider-opensandbox-mapping.md`.
