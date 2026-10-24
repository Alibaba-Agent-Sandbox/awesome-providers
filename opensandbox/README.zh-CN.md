# opensandbox 提供方插件

已验收范围：Docker 后端，OpenSandbox server 1.1.1 与固定摘要的 release-1.1.1 execd，涵盖 CLI、Python SDK 和项目构建启动及清理。Kubernetes、网络策略、安全访问和代码解释器不在本次验收范围。详见[提供方验收](../docs/acceptance.md)。

[English](README.md)

一个 [EPP/1](https://github.com/Alibaba-Agent-Sandbox/python-sdk/blob/main/docs/zh/design/providers-and-credentials.md) **Node 提供方**插件，让 Agent Sandbox 在
[OpenSandbox](https://github.com/opensandbox-group/OpenSandbox) 服务（Docker 或 Kubernetes 运行时）上创建沙箱。
Python SDK（`Sandbox.create(provider="opensandbox")`）与 `abx` CLI（`abx --provider opensandbox ...`）均可直接使用。

本目录是插件的唯一源码，位于
[alibaba-agent-sandbox/awesome-providers](https://github.com/alibaba-agent-sandbox/awesome-providers)，不在 Python SDK 仓库里。

* 运行时：**Node.js >= 20，无 npm 依赖**（使用内置 `fetch`；终端需要 Node 22+ 的全局 `WebSocket`）。选择 Node 是因为 `abx` CLI 本身基于 Node，
  使用 CLI 的用户已具备 Node；仅使用 Python SDK 时需要 `node` 在 `PATH` 中。
* 设计与 API 映射：[`provider-opensandbox-mapping.md`](https://github.com/Alibaba-Agent-Sandbox/python-sdk/blob/main/docs/en/design/provider-opensandbox-mapping.md)（仅英文）。
* 产出本插件的编写体验评估：[`provider-authoring-evaluation.md`](https://github.com/Alibaba-Agent-Sandbox/python-sdk/blob/main/docs/zh/design/provider-authoring-evaluation.md)。

## 安装
此 provider 提交需要 CLI 0.4.15+、Python SDK 0.3.1a3+，以读取源码准备元数据。

```bash
abx provider install alibaba-agent-sandbox/awesome-providers//opensandbox@<40位提交哈希> --yes
abx provider info opensandbox          # 这次安装声明了哪些能力
abx provider doctor opensandbox
```

`//opensandbox` 是子目录，和 `abx template install owner/repo//subdir` 的 `//` 相同。带 `--subdir` 的 git URL 仍然可用，两种写法不能互相矛盾。

检出本目录后也可以 `abx provider install ./opensandbox --yes`。没有 40 位 `--ref` 的分支或标签属于未固定安装，
在非交互环境还需要 `--allow-unpinned`。`file://` 等明文传输另需 `--allow-insecure-transport`。Python 安装器接受同一路径：

```bash
python -m agent_sandbox.providers install ./opensandbox --yes
```

安装不会执行任何代码；只有命令实际用到插件时才会启动，且每次启动前都会按安装回执重新校验文件摘要。

## 配置

每个字段都可通过规范名称 `ABX_OPENSANDBOX_<FIELD>`、`~/.abx/config.toml` 的 `[providers.opensandbox]` 段，
或（有列出时）OpenSandbox 原生环境变量设置。规范名称优先。

| 字段 | 原生别名 | 默认值 | 含义 |
|---|---|---|---|
| `base_url` | | `http://127.0.0.1:8080` | 服务根地址（可带 `/v1` 后缀） |
| `api_key`（机密） | `OPEN_SANDBOX_API_KEY` | 无 | 以 `OPEN-SANDBOX-API-KEY` 头发送；本地服务可不需要 |
| `domain`、`protocol` | `OPEN_SANDBOX_DOMAIN`、`OPEN_SANDBOX_PROTOCOL` | `http` | `host[:port]`，`base_url` 的替代写法 |
| `use_server_proxy` | `OPEN_SANDBOX_USE_SERVER_PROXY` | `false` | 通过服务代理访问沙箱 |
| `default_image` | | `python:3.12-slim` | 通用模板 `base` 使用的镜像 |
| `image_aliases` | | `code=opensandbox/code-interpreter:v1.1.0` | `name=image,...` 形式的模板短名 |
| `entrypoint` | | `tail -f /dev/null` | 显式的保活默认值。应用工作流通过 exec 启动声明的服务。不会根据镜像名选择运行时脚本；其他进程需要显式配置 |
| `ready_timeout` | | `60` | 等待 Running 与 execd 就绪的秒数 |
| `registry_username`、`registry_password`（机密） | | 无 | 私有镜像仓库认证 |
| `network_policy` | | 无 | 应用于每个新沙箱的 JSON 网络策略 |
| `platform` | | 无 | `linux/amd64`、`linux/arm64` 等 |
| `secure_access` | | `false` | Kubernetes 网关安全访问 |

`Sandbox.create(template=...)` 的解析顺序：先查别名，其次 `base` 映射到 `default_image`，否则按镜像引用原样使用。

## CLI 和 SDK 能调用什么

两边加载的是同一个插件。方法和命令只有在清单声明了对应能力时才可用，否则会在发出请求之前返回 `E8004`。`abx provider info opensandbox` 打印这份声明。

| 你要做的事 | CLI | SDK | 本提供商 |
|---|---|---|---|
| 创建、列出、查看、销毁、按 id 再次连接 | `create`、`list`、`info`、`kill`、`connect` | `Sandbox.create/connect/list/kill` | 支持（`sandbox.lifecycle`、`sessions`） |
| 执行进程，包括流式输出 | `exec`、`sandbox shell-stream` | `commands.run`、`commands.stream` | 支持 |
| 调用模板命令 | `run` | application client 的 `commands.run` | 需要模板应用服务 |
| 文件、上传、下载 | `upload`、`download`、`sandbox files` | `files.*` | 支持 |
| 修改超时、暂停、恢复 | `sandbox timeout/pause/resume` | `set_timeout`、`pause`、`resume` | 支持 |
| 端口的公网 URL | `sandbox url` | `network.get_url` | 支持 |
| 进程列出、发信号、终止 | `sandbox process` | `commands.list/kill` | 部分：stdin 返回 E8004；execd 命令 id 只能 SIGKILL |
| 交互终端 | 无独立 PTY 命令（`connect` 是逐行 REPL） | `get_terminal` | provider 引擎运行 Node 22+ 时可用 |
| `run_code`、EPP 模板 RPC、文件监听、签名 URL、域名、OSS、VPC | 对应命令 | `run_code`、EPP 模板 RPC | 当前适配器未接入（E8004） |

创建时的 `template` 是容器镜像。`base` 表示 `default_image`（未修改时是 `python:3.12-slim`）。

## 能力

| 特性 | 状态 | 说明 |
|---|---|---|
| `sandbox.lifecycle` | 支持 | 创建（等待 Running 与 execd，失败时回收）、connect、get、list（分页）、kill（幂等） |
| `sandbox.timeout` | 支持 | `set_timeout`；OpenSandbox 最小 60 秒会被截断；新的到期时间按服务端时钟计算 |
| `sandbox.pause` | 支持 | pause / resume（Docker 运行时） |
| `exec.run`、`exec.stream` | 支持 | env、cwd、user、stdin、timeout；有序的 `exec.output` 与唯一的 `exec.exit`；`$/cancel` 可中止命令 |
| `process.manage` | 部分 | `process.list`；`process.kill` / `process.signal`（数字 pid：任意信号；execd 命令 id：仅 SIGKILL）；`process.stdin` 返回 `E8004` |
| `files.rw` | 支持 | read（offset/length）、write（mode）、list、stat、mkdir、remove、move，另有 `files.search`、`files.chmod` 扩展（目前无宿主调用） |
| `ports.url` | 支持 | `ports.url` 方法（直连端点，或配合 `use_server_proxy` 走服务代理） |
| `sessions` | 支持 | 通过 `exec.start` 的 `detached` 扩展实现后台命令（目前尚无宿主适配器发送该参数） |
| `pty` | 支持（Node 22+） | `pty.open` 创建 execd 终端（`POST /pty`）并桥接它的 WebSocket（`/pty/{id}/ws`）：输入是 `0x00` + 字节，`pty.output` 携带输出，`pty.exit` 结束。Node 20/21 没有全局 WebSocket，插件不会声明 `pty` |
| `code.default-context.execute`、`templates.*`、`files.watch`、传输 URL | 不支持 | `E8004`（`-32003`） |

## 测试

```bash
node tests/run.mjs                      # 24 个单元测试 + 21 个模拟服务测试，无需真实服务
```

联机测试需要可访问的 OpenSandbox 服务。一键本地启动在 SDK 的测试工具里
（[e2e/opensandbox](https://github.com/Alibaba-Agent-Sandbox/python-sdk/blob/main/e2e/opensandbox/README.md)）：
它负责启动服务并安装本插件，不是插件的第二份源码。

```bash
export ABX_OPENSANDBOX_BASE_URL=http://127.0.0.1:8080
export OPEN_SANDBOX_API_KEY=...         # 按你的服务要求设置
OPENSANDBOX_LIVE=1 node tests/run.mjs live                         # 直接以 EPP/1 驱动插件
OPENSANDBOX_LIVE=1 python -m pytest tests/contract                 # 契约测试套件 + SDK 场景
```

`tests/contract` 需要可导入的 `agent_sandbox` 和 `pytest`；它把插件安装到临时的 `~/.abx`，不会改动你真实的存储。

## 目录结构

```
abx-provider.toml   清单（运行时、特性、安全声明、配置模式）
provider.mjs        入口：EPP 分发与能力装配
src/                http.mjs（生命周期 + execd 客户端）、sandbox.mjs、exec.mjs、files.mjs、
                    sse.mjs、multipart.mjs、convert.mjs、config.mjs、errors.mjs、epp.mjs
tests/              unit/、mock/（进程内模拟服务）、live/、contract/（pytest）
```

## 已知限制

* 文件读写受 EPP 8 MiB 行长度限制（单次读取上限 4 MiB，可用 `offset`/`length` 分段）。
* 传给 `Sandbox.create` 的 `secure=True` 会请求网关“安全访问”（仅 Kubernetes 网关部署；Docker 服务会拒绝）。`secure=False` 或不传 `secure` 则保持关闭；也可用 `secure_access` 配置字段设置全局默认值。
* 按次创建的设置：传给 `Sandbox.create` 的 `provider_options={"network_policy": ..., "platform": ..., "default_image": ...}` 只对该沙箱覆盖已配置的值（白名单：`default_image`、`image_aliases`、`entrypoint`、`ready_timeout`、`registry_username`、`registry_password`、`network_policy`、`platform`、`secure_access`；绝不包括服务地址或 API key）。
* 对所有提供方，`commands.start()` 都是惰性的（迭代流之前什么都不会发送）；要启动后台进程，请通过 `commands.run(..., shell=True)` 运行 `nohup ... &`。

许可证：Apache-2.0。

## Project source preparation / 项目源码准备

The Node template manager supports `templates.build` for `abx template launch`: Docker builds and pushes the source and OpenSandbox consumes the returned image reference. The EPP template RPCs in the table remain unsupported. See [prerequisites and acceptance scope](docs/README.md).

Node 模板管理器通过 `templates.build` 支持 `abx template launch`：Docker 构建并推送源码，OpenSandbox 使用返回的镜像引用。上表中的 EPP 模板 RPC 仍不支持。参见[前置条件与验收范围](docs/README.md)。

流式启动必须收到 execd 原生 `init` 事件及其进程标识；缺少确认时直接失败，不会伪造标识或重放结果不确定的命令。

execd 必须支持原生 `argv` 请求并保留输出字节；旧接口不受支持，命令失败不会切换协议重试。

### 创建失败清理

获得 ID 后的创建失败会尝试删除实例，包括调用方取消和最后读取详情失败。原始异常保持为主错误。若清理失败，EPP 错误数据包含 `cleanup: {sandbox_id, status: "failed"}` 并输出恢复提示；请核对并删除该次创建的实例。DELETE 成功不等于已独立确认后端实例不存在。
