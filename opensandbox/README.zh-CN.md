# opensandbox 提供方插件

[English](README.md)

通过 Python SDK（`ProviderSandbox.create(provider="opensandbox")`）或 CLI（`abx --provider opensandbox ...`），在已有的 [OpenSandbox](https://github.com/opensandbox-group/OpenSandbox) 服务上创建和管理沙箱。支持 Docker 后端。Kubernetes 专用网络策略与安全访问不在当前文档支持范围内；本提供方尚未实现原生代码解释器 API。

本目录是插件的唯一源码，位于
[alibaba-agent-sandbox/awesome-providers](https://github.com/alibaba-agent-sandbox/awesome-providers)，不在 Python SDK 仓库里。

Python 通过本机 `abx` 引擎调用这个 Node 提供方。推荐的独立 `abx` 二进制已经内嵌 Node，Python 用户无需另装 Node.js、npm。npm 安装的 CLI 需要 Node.js 20+；交互终端要求引擎使用 Node.js 22+。详见[环境要求与快速准备](../docs/zh/install.md#环境要求)。

## 安装

先按[安装指南](../docs/zh/install.md#python-快速准备)准备 `abx`；Python 用户还需 Python 3.10+ 和 SDK。然后安装一次本提供方：

```bash
python -m agent_sandbox.providers install registry:opensandbox --yes
python -m agent_sandbox.providers doctor opensandbox
```

这条索引安装路径不需要 Git。安装提供方不会安装或启动 OpenSandbox 服务。本机运行服务或构建源码镜像时才需要客户端 Docker；连接已有远端服务不需要。

服务端与 execd 需要匹配。文档中的 Docker 配置使用 OpenSandbox server 1.1.1 与 release-1.1.1 execd，不要混用持续变化的 `latest` execd 镜像。

仅使用 CLI 时，也可从固定的 Git 来源安装（需要 Git）：

```bash
abx provider install alibaba-agent-sandbox/awesome-providers//opensandbox@<40位提交哈希> --yes
abx provider info opensandbox          # 这次安装声明了哪些能力
abx provider doctor opensandbox
```

`//opensandbox` 是子目录，和 `abx template init ./project --from owner/repo//subdir` 的 `//` 相同。带 `--subdir` 的 git URL 仍然可用，两种写法不能互相矛盾。

检出本目录后也可以 `abx provider install ./opensandbox --yes`。没有 40 位 `--ref` 的分支或标签属于未固定安装，
在非交互环境还需要 `--allow-unpinned`。`file://` 等明文传输另需 `--allow-insecure-transport`。Python 安装器接受同一路径：

```bash
python -m agent_sandbox.providers install ./opensandbox --yes
```

本提供方的兼容性下限为 CLI 0.4.16、Python SDK 0.3.1a4。运行当前应用模板请使用当前 CLI，见[模板启动指南](https://github.com/Alibaba-Agent-Sandbox/agent-sandbox/blob/main/docs/zh/guide/template-launch.md)。

同意前仅检查静态元数据，不执行插件。同意后，默认验证可能导入并初始化这个 Node 插件以完成握手。
`--yes` 表示接受授权，不会跳过验证。普通安装在加载时按回执校验文件摘要；`--link` 是开发场景的例外。
详见 [CLI 安装与信任指南](https://github.com/Alibaba-Agent-Sandbox/agent-sandbox/blob/main/docs/zh/guide/providers.md)。

## 配置

默认服务地址为 `http://127.0.0.1:8080`，使用这个地址时不用重复导出。其他服务请设置实际地址；服务启用鉴权时，向其管理员获取 OpenSandbox API Key，并在使用前配置：

```bash
# 仅在服务与本地无鉴权的默认配置不同时设置：
export ABX_OPENSANDBOX_BASE_URL="https://opensandbox.example.com"
export ABX_OPENSANDBOX_API_KEY="<OpenSandbox 管理员提供的密钥>"
```

该密钥用于 OpenSandbox 服务鉴权，与极速版 Sandbox API Key、模板应用的 `ABX_SERVER_TOKEN` 分开。

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
| `entrypoint` | | `tail -f /dev/null` | 显式的保活默认值。模板 launcher 通过 exec 执行声明的 `start_cmd`，启动全部应用服务。不会根据镜像名选择运行时脚本；其他进程需要显式配置 |
| `ready_timeout` | | `60` | 等待 Running 与 execd 就绪的秒数 |
| `registry_username`、`registry_password`（机密） | | 无 | 私有镜像仓库认证 |
| `network_policy` | | 无 | 应用于每个新沙箱的 JSON 网络策略 |
| `platform` | | 无 | `linux/amd64`、`linux/arm64` 等 |
| `secure_access` | | `false` | Kubernetes 网关安全访问 |

`ProviderSandbox.create(template=...)` 的解析顺序：先查别名，其次 `base` 映射到 `default_image`，否则按镜像引用原样使用。

## 调用原理与性能

```text
Python ProviderSandbox → 本机 abx 引擎 → OpenSandbox 提供方 → OpenSandbox/execd
abx CLI                → OpenSandbox 提供方               → OpenSandbox/execd
```

引擎按需启动并持续复用，Python 的命令和文件操作也经过它。与等价原生 Python 提供方相比，这增加了本机通信、数据编解码、可能的数据拷贝，以及额外进程的内存占用。首次调用还包含启动与加载；高频短操作和较大传输更容易体现持续调用的开销。完整 SDK 路径没有固定毫秒数或吞吐保证，如何评估自己的负载见[性能说明](../docs/zh/install.md#调用原理与性能)。二进制内嵌 Node 简化了准备步骤，仍保留这条转发路径。

## CLI 和 SDK 能调用什么

两边加载的是同一个插件。方法和命令只有在清单声明了对应能力时才可用，否则会在发出请求之前返回 `E8004`。`abx provider info opensandbox` 打印这份声明。

| 你要做的事 | CLI | SDK | 本提供商 |
|---|---|---|---|
| 创建、列出、查看、销毁、按 id 再次连接 | `create`、`list`、`info`、`kill`、`connect` | `ProviderSandbox.create/connect/list`、实例 `kill` | 支持（`sandbox.lifecycle`、`sessions`） |
| 执行进程，包括流式输出 | `exec`（无独立流式命令） | `commands.run`、`commands.stream` | 支持 |
| 调用模板命令 | `run` | application client 的 `commands.run` | 需要模板应用服务 |
| 文件、上传、下载 | `upload`、`download`、`sandbox files` | `files.*` | 支持 |
| 修改超时、暂停、恢复 | 此提供方通过 SDK 调用 | `set_timeout`、`pause`、`resume` | 支持 |
| 端口访问地址与认证头 | 无独立 URL 命令 | `await network.resolve(port)` | 支持 |
| 进程列出、发信号、终止 | `sandbox process` | `commands.list/kill` | 部分：stdin 返回 E8004；execd 命令 id 只能 SIGKILL |
| 交互终端 | 无独立 PTY 命令（`connect` 是逐行 REPL） | `get_terminal` | provider 引擎运行 Node 22+ 时可用 |

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

## 贡献

见[贡献说明](../CONTRIBUTING.md)与[测试分层](../docs/e2e.zh-CN.md)。面向贡献者的提供方契约见 [API 对应关系](https://github.com/Alibaba-Agent-Sandbox/python-sdk/blob/main/docs/en/design/provider-opensandbox-mapping.md)。

## 已知限制

* 文件读写受 EPP 8 MiB 行长度限制（单次读取上限 4 MiB，可用 `offset`/`length` 分段）。
* 传给 `ProviderSandbox.create` 的 `secure=True` 会请求网关“安全访问”（仅 Kubernetes 网关部署；Docker 服务会拒绝）。`secure=False` 或不传 `secure` 则保持关闭；也可用 `secure_access` 配置字段设置全局默认值。
* 按次创建的设置：传给 `ProviderSandbox.create` 的 `provider_options={"network_policy": ..., "platform": ..., "default_image": ...}` 只对该沙箱覆盖已配置的值（白名单：`default_image`、`image_aliases`、`entrypoint`、`ready_timeout`、`registry_username`、`registry_password`、`network_policy`、`platform`、`secure_access`；绝不包括服务地址或 API key）。
* 对所有提供方，`commands.start()` 都是惰性的（迭代流之前什么都不会发送）；要启动后台进程，请通过 `commands.run(..., shell=True)` 运行 `nohup ... &`。

许可证：Apache-2.0。

## Project source preparation / 项目源码准备

The Node template manager supports `templates.build` for `abx deploy`: Docker builds and pushes the source and OpenSandbox consumes the returned image reference. The EPP template RPCs in the table remain unsupported. See [prerequisites and acceptance scope](docs/README.md).

Node 模板管理器通过 `templates.build` 支持 `abx deploy`：Docker 构建并推送源码，OpenSandbox 使用返回的镜像引用。上表中的 EPP 模板 RPC 仍不支持。参见[前置条件与验收范围](docs/README.md)。

流式启动必须收到 execd 原生 `init` 事件及其进程标识；缺少确认时直接失败，不会伪造标识或重放结果不确定的命令。

execd 必须支持原生 `argv` 请求并保留输出字节；旧接口不受支持，命令失败不会切换协议重试。

### 创建失败清理

获得 ID 后的创建失败会尝试删除实例，包括调用方取消和最后读取详情失败。原始异常保持为主错误。若清理失败，EPP 错误数据包含 `cleanup: {sandbox_id, status: "failed"}` 并输出恢复提示；请核对并删除该次创建的实例。DELETE 成功不等于已独立确认后端实例不存在。
