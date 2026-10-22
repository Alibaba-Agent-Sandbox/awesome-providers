# OpenSandbox

**状态：Beta。** 本提供方暂未完成正式版验收。已声明的能力不等于已通过真实后端端到端测试；当前仅阿里云极速版为正式版。局部测试结果不会自动升级此状态。

目录提供方，id 是 `opensandbox`。不是随 SDK 编译进去的。类型 `node`：一个 ES 模块（`provider.mjs`，无 npm 依赖），导出 `create(kit)`，宿主在进程内调用它的 EPP/1 方法（`kit.epp.infra`）。CLI 直接使用它，Python 以及之后的 Node、Go、Java SDK 通过本机引擎（`abx provider engine serve`）使用它。`node provider.mjs` 仍可在 stdio 上提供 EPP/1，供其他宿主使用。需要 `node` 在 `PATH` 里。

总说明：[工作原理](../../docs/zh/principle.md) · [安装](../../docs/zh/install.md)

## 安装和调用

```bash
abx provider install alibaba-agent-sandbox/awesome-providers//opensandbox --allow-unpinned --yes   # 或 Python：python -m agent_sandbox.providers install registry:opensandbox --yes（索引上线后）
abx --provider opensandbox create
```

```python
from agent_sandbox.api.sandbox import Sandbox

sb = await Sandbox.create(provider="opensandbox", template="base", timeout=300)
print((await sb.commands.run("echo ok", timeout=30)).stdout)
await sb.kill()
```

`template="base"` 使用镜像 `python:3.12-slim`，入口是 `tail -f /dev/null`。带 `:` 或 `/` 的模板名按镜像 URI 使用。

## 配置

| 项 | 环境变量 | 默认 |
|---|---|---|
| 生命周期地址，不带 `/v1` | `ABX_OPENSANDBOX_BASE_URL` | `http://127.0.0.1:8080` |
| 请求头 `OPEN-SANDBOX-API-KEY` | `ABX_OPENSANDBOX_API_KEY`，原生别名 `OPEN_SANDBOX_API_KEY` | 不设置 |

每个配置字段都由宿主解析为 `ABX_OPENSANDBOX_<FIELD>`，也可放在 `provider_options` 或 `~/.abx/config.toml` 的 `[providers.opensandbox]` 段。同一环境配置层内，规范名称优先于清单声明的原生别名。其他原生别名是 `OPEN_SANDBOX_DOMAIN`、`OPEN_SANDBOX_PROTOCOL` 和 `OPEN_SANDBOX_USE_SERVER_PROXY`；完整字段表见[提供方 README](../README.zh-CN.md#配置)。插件本身只接收宿主传入的配置，直接运行 EPP/1 时由 `initialize.config` 提供。

清单的 `[core] inherit = []`，不接收极速版的 `sandbox_api_key`、`sandbox_base_url` 或 `sandbox_domain`。未声明 `OPENSANDBOX_API_KEY`、`OPENSANDBOX_BASE_URL` 这两种别名。

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
| `sessions` | `exec.start` 的 `detached` 扩展，后台命令通过日志游标跟踪；目前宿主适配器尚未发送该参数 |

## 会抛出 E8004 的调用

`files.watch`、`files.transfer`、`templates.read`、`ports.domain`、`storage.mount`、`network.vpc`、`code.interpret`。

`POST /code` 只有带 Jupyter 的 code-interpreter 镜像才有。默认的 `python:3.12-slim` 没有，所以代码解释器不声明。已声明的 `sessions` 指后台命令扩展；`POST /session` 那种有状态 shell 也没接。

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
| Lifecycle origin, no `/v1` | `ABX_OPENSANDBOX_BASE_URL` | `http://127.0.0.1:8080` |
| Header `OPEN-SANDBOX-API-KEY` | `ABX_OPENSANDBOX_API_KEY`, native alias `OPEN_SANDBOX_API_KEY` | unset |

The host resolves each field through its canonical `ABX_OPENSANDBOX_<FIELD>` name, `provider_options`, or `[providers.opensandbox]` in `~/.abx/config.toml`. Within an environment layer the canonical name takes precedence over native aliases declared in the manifest. Other native aliases are `OPEN_SANDBOX_DOMAIN`, `OPEN_SANDBOX_PROTOCOL` and `OPEN_SANDBOX_USE_SERVER_PROXY`; see the [full field table](../README.md#configure). The plugin receives resolved configuration from its host; direct EPP/1 callers supply `initialize.config`.

The manifest has `[core] inherit = []`: Express `sandbox_api_key`, `sandbox_base_url` and `sandbox_domain` are not passed to this plugin. `OPENSANDBOX_API_KEY` and `OPENSANDBOX_BASE_URL` are not declared aliases.

The plugin module (in the host process) talks to the OpenSandbox lifecycle API and to each sandbox's execd (command SSE, files, the terminal WebSocket). The terminal needs the global `WebSocket` of Node 22+. `Sandbox.connect` in a second interpreter asks the lifecycle API for the execd address and can run a command; it does not need the session object kept by the process that created the sandbox.

Declared: `templates.build` (node/1 project preparation), `sandbox.lifecycle`, `sandbox.timeout`, `sandbox.pause`, `exec.run`, `exec.stream`, `process.manage`, `pty`, `files.rw`, `ports.url`, `sessions`. `sessions` is the `detached` extension of `exec.start`, following background command output through a log cursor; no host adapter sends it yet. It does not implement a stateful shell through `POST /session`. `commands.send_input` is `E8004` because `/command` has no stdin. `code.interpret` is `E8004` because `POST /code` exists only on a Jupyter image.

On 2026-10-14 a local OpenSandbox 1.1.1 returned real results for create, list, kill, renew, pause/resume, exec, streaming, a `/proc` process list, a PTY `echo`, a file round-trip, and a port URL. `Sandbox.connect` in a second interpreter also ran `echo fresh-exec-ok`. The capability table is `python-sdk/docs/en/design/provider-opensandbox-mapping.md`.

## 自动准备项目（Beta） / Automatic project preparation (Beta)

使用包含 `template launch` 和 `kit.project` 的 CLI 源码版，安装或更新本插件后运行：

```sh
abx --provider opensandbox template launch alibaba-agent-sandbox/awesome-templates//python-hello --yes
```

提供方现在声明 `templates.build`，用于 node/1 管理器的 `prepareProject`。CLI 自动把适配器返回的 ID、名称或镜像传给创建，启动服务并验证就绪；缺少模板声明的运行时能力时，在构建前拒绝。正常沙箱行为不变。

Use a CLI source build containing `template launch` and `kit.project`. The node/1 `prepareProject` manager is guarded by `templates.build`. The exact returned native reference is handed to sandbox creation. Missing runtime capabilities fail before build. Normal sandbox operations remain unchanged.

先配置 Docker 登录、可写 `ABX_OPENSANDBOX_IMAGE_REPOSITORY` 及服务连接；有占位符时设置 `ABX_OPENSANDBOX_BUILD_BASE_IMAGE`。此路径直接返回已推送的镜像，不创建或伪造模板 ID。当前 `code.interpret` 未声明，要求该能力的模板仍被拒绝；自建仅需 shell/files/ports 的目录可走新入口。EPP 的模板 RPC 仍不支持；项目准备是 node/1 管理器能力。

Configure Docker login, a writable `ABX_OPENSANDBOX_IMAGE_REPOSITORY` and the server; set `ABX_OPENSANDBOX_BUILD_BASE_IMAGE` for unresolved placeholders. The adapter returns the pushed image directly, never a fabricated template ID. `code.interpret` remains undeclared, so templates requiring it are rejected. A project requiring only supported shell/files/ports can use the new flow. EPP template RPCs remain unsupported; preparation is a node/1 manager operation.

所有新路径保持 Beta；原生 E2B、Cube、集群验收仍按维护者要求暂缓。单元/回环/实际 SDK 测试不能当成云验收。临时目录会清理；成功沙箱、镜像和已登记模板不会自动删除，可能继续计费。准备超时可能遗留已提交产物，启动/就绪失败会尝试删除本次新建沙箱并报告清理状态。源码安装、引用契约及完整限制见[指南](https://github.com/Alibaba-Agent-Sandbox/agent-sandbox/blob/main/docs/zh/guide/template-launch.md)。

All new paths remain Beta. Native E2B/Cube/cluster acceptance is explicitly deferred by the maintainer; unit/loopback/official SDK protocol tests are not cloud acceptance. Temporary staging is cleaned. Successful sandboxes, images and registered templates are retained and may incur cost. Preparation timeout may leave submitted artifacts; startup/readiness failure attempts cleanup of this invocation's new sandbox. See the [host guide](https://github.com/Alibaba-Agent-Sandbox/agent-sandbox/blob/main/docs/en/guide/template-launch.md) for installation, reference contracts and limits.
