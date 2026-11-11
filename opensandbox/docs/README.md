# OpenSandbox

通过 `opensandbox` 提供方，CLI 和 Python SDK 可以使用已有的 OpenSandbox 服务。支持 Docker 后端；Kubernetes 专用网络策略、安全访问及原生代码解释器不在当前支持范围内。

Python 也需要 Node 运行时来运行这个提供方，但推荐的独立 `abx` 二进制已内嵌运行时，无需另装 Node.js、npm。使用 npm 版 CLI 时需要 Node.js 20+；交互终端要求引擎使用 Node.js 22+。Python SDK 需要 Python 3.10+。连接远端服务无需客户端 Docker；本机运行服务或构建源码镜像时才需要 Docker。

总说明：[工作原理](../../docs/zh/principle.md) · [安装](../../docs/zh/install.md)

## 安装和调用

先按[快速准备](../../docs/zh/install.md#python-快速准备)安装 `abx` 和 Python SDK，再安装本提供方。索引安装不需要 Git；提供方安装不会启动 OpenSandbox 服务。

```bash
python -m agent_sandbox.providers install registry:opensandbox --yes
abx --provider opensandbox deploy --name my-sandbox --template-id base
```

```python
import asyncio
from agent_sandbox import ProviderSandbox

async def main():
    sb = await ProviderSandbox.create(provider="opensandbox", template="base", timeout=300)
    try:
        print((await sb.commands.run("echo ok", timeout=30)).stdout)
    finally:
        try:
            await sb.kill()
        finally:
            await sb.close()

asyncio.run(main())
```

`template="base"` 使用镜像 `python:3.12-slim`，入口是 `tail -f /dev/null`。带 `:` 或 `/` 的模板名按镜像 URI 使用。
CLI 创建会返回沙箱 ID，用完后执行 `abx --provider opensandbox delete <sandbox-id>`。Python 示例无论命令是否成功都会尝试删除沙箱并关闭客户端。

## 配置

地址默认是 `http://127.0.0.1:8080`，相同时不用导出地址。其他服务需设置实际的 `ABX_OPENSANDBOX_BASE_URL`；启用鉴权时向 OpenSandbox 管理员获取服务 API Key，设置 `ABX_OPENSANDBOX_API_KEY`。它与极速版 Sandbox API Key、模板应用令牌分开。

| 项 | 环境变量 | 默认 |
|---|---|---|
| 生命周期地址，不带 `/v1` | `ABX_OPENSANDBOX_BASE_URL` | `http://127.0.0.1:8080` |
| 请求头 `OPEN-SANDBOX-API-KEY` | `ABX_OPENSANDBOX_API_KEY`，原生别名 `OPEN_SANDBOX_API_KEY` | 不设置 |

每个配置字段都可通过 `ABX_OPENSANDBOX_<FIELD>` 或 `~/.abx/config.toml` 的 `[providers.opensandbox]` 段设置。同一环境配置层内，规范名称优先于清单声明的原生别名。其他原生别名是 `OPEN_SANDBOX_DOMAIN`、`OPEN_SANDBOX_PROTOCOL` 和 `OPEN_SANDBOX_USE_SERVER_PROXY`；完整字段表与单次创建可覆盖的设置见[提供方 README](../README.zh-CN.md#配置)。

清单的 `[core] inherit = []`，不接收极速版的 `sandbox_api_key`、`sandbox_base_url` 或 `sandbox_domain`。未声明 `OPENSANDBOX_API_KEY`、`OPENSANDBOX_BASE_URL` 这两种别名。

## 调用原理与性能

```text
Python ProviderSandbox → 本机 abx 引擎 → 提供方 → OpenSandbox/execd
abx CLI                → 提供方       → OpenSandbox/execd
```

引擎按需启动并持续复用，命令和文件操作也经过它。Python 这条路径比原生直连多了本机通信、编解码、可能的数据拷贝和额外进程内存，首次调用还可能有启动与加载开销。高频短调用和大数据传输需要特别关注；完整 SDK 路径没有固定的毫秒数或吞吐保证。独立二进制只简化安装，不移除运行时或转发开销。详见[性能说明](../../docs/zh/install.md#调用原理与性能)。API 对应关系供贡献者参考：[设计文档](https://github.com/Alibaba-Agent-Sandbox/python-sdk/blob/main/docs/en/design/provider-opensandbox-mapping.md)。

## 会抛出 E8004 的调用

`files.watch`、`files.transfer`、`templates.read`、`ports.domain`、`storage.mount`、`network.vpc`、`code.default-context.execute`。

当前项目 adapter 没有接入原生解释器协议，因此所有 `code.*` 均不声明；这不等于平台或镜像没有解释器。已声明的 `sessions` 指后台命令扩展；`POST /session` 那种有状态 shell 也没接。

## English

Use the `opensandbox` provider to access an existing OpenSandbox service from the CLI or Python SDK. Docker-backed deployments are supported. Kubernetes-specific network policy and secure access, and native code-interpreter APIs, are outside this support scope.

Python also uses a Node runtime for this provider. The recommended standalone `abx` binary includes it, so no separate Node.js or npm installation is needed. An npm-installed CLI needs Node.js 20+; interactive terminals require an engine running Node.js 22+. The Python SDK needs Python 3.10+. Docker is needed on the client for a local server or source-image builds, not for connecting to an existing remote service.

Follow [quick setup](../../docs/en/install.md#quick-setup-for-python) to install `abx` and the Python SDK, then install the provider. Registry installation needs no Git and does not start an OpenSandbox service:

```bash
python -m agent_sandbox.providers install registry:opensandbox --yes
```

`template="base"` is the image `python:3.12-slim` with entrypoint `tail -f /dev/null`. A template name that contains `:` or `/` is used as an image URI.

| Setting | Environment | Default |
|---|---|---|
| Lifecycle origin, no `/v1` | `ABX_OPENSANDBOX_BASE_URL` | `http://127.0.0.1:8080` |
| Header `OPEN-SANDBOX-API-KEY` | `ABX_OPENSANDBOX_API_KEY`, native alias `OPEN_SANDBOX_API_KEY` | unset |

The default address needs no export. For another server, set `ABX_OPENSANDBOX_BASE_URL`. If authentication is enabled, obtain the service API key from its administrator and set `ABX_OPENSANDBOX_API_KEY`; it is separate from Express and template-application credentials.

Set fields through their canonical `ABX_OPENSANDBOX_<FIELD>` names or `[providers.opensandbox]` in `~/.abx/config.toml`. Within an environment layer the canonical name takes precedence over native aliases declared in the manifest. Other native aliases are `OPEN_SANDBOX_DOMAIN`, `OPEN_SANDBOX_PROTOCOL` and `OPEN_SANDBOX_USE_SERVER_PROXY`; see the [full field table and per-create overrides](../README.md#configure).

The manifest has `[core] inherit = []`: Express `sandbox_api_key`, `sandbox_base_url` and `sandbox_domain` are not passed to this plugin. `OPENSANDBOX_API_KEY` and `OPENSANDBOX_BASE_URL` are not declared aliases.

The call path is `Python ProviderSandbox → local abx engine → provider → OpenSandbox/execd`; the CLI runs the provider directly. The engine starts on demand and is reused for commands and file operations. Compared with equivalent native Python access, this adds local communication, data encoding/decoding, possible copies and another process's memory, plus startup/loading for the first call. Frequent short operations and large transfers need particular attention. There is no fixed millisecond or throughput guarantee for the complete SDK path. The binary simplifies installation without removing the runtime or forwarding costs; see [performance guidance](../../docs/en/install.md#call-path-and-performance). Contributors can find the API mapping in the [design document](https://github.com/Alibaba-Agent-Sandbox/python-sdk/blob/main/docs/en/design/provider-opensandbox-mapping.md).

Declared: `templates.build` (node/1 project preparation), `sandbox.lifecycle`, `sandbox.timeout`, `sandbox.pause`, `exec.run`, `exec.stream`, `process.manage`, `pty`, `files.rw`, `ports.url`, `sessions`. `sessions` is the `detached` extension of `exec.start`, following background command output through a log cursor; no host adapter sends it yet. It does not implement a stateful shell through `POST /session`. `commands.send_input` is `E8004` because `/command` has no stdin. `code.default-context.execute` is `E8004` because `POST /code` exists only on a Jupyter image.

## 自动准备项目 / Automatic project preparation

安装官网当前 CLI 并配置 OpenSandbox 连接。模板会整体启动它声明的服务。
应用令牌 `ABX_SERVER_TOKEN` 用于模板内服务，不是 OpenSandbox 平台 API Key。
正常交互式启动可按提示自动生成并保存令牌；已发布 CLI 0.5.8 在首次使用
`--yes` 时若尚无应用令牌会退出，应先运行交互式启动或配置令牌。

Install the current CLI and configure OpenSandbox. A template starts all its declared
services. Its separate `ABX_SERVER_TOKEN` authenticates the application, not the provider.
Interactive launch can generate and save it. Published CLI 0.5.8 exits on a first
`--yes` launch without an application token; first launch interactively or configure one.

```sh
abx --provider opensandbox deploy alibaba-agent-sandbox/awesome-templates//python-hello --name my-app
```

The provider owns project preparation through `templates.build` / `prepareProject`.
The CLI passes the returned immutable image reference to the same provider,
starts the template and checks readiness. Backend credentials, Docker login and
image-repository access belong to provider configuration.

先配置 Docker 登录、可写 `ABX_OPENSANDBOX_IMAGE_REPOSITORY` 和服务连接。新版 CLI 会在临时构建目录解析官方基础镜像的区域、标签并准备固定版本的服务端；不修改模板源码。自定义构建方案仍可通过 `--build-profile` 显式选择。构建后返回镜像引用，供同一 OpenSandbox 后端创建实例。

Configure Docker login, a writable `ABX_OPENSANDBOX_IMAGE_REPOSITORY`, and the server. The updated CLI resolves the official base image region/tag and prepares the pinned server in a temporary build directory; the template source stays unchanged. Select an optional custom recipe with `--build-profile`. Preparation returns the image reference consumed by OpenSandbox.

For a custom application token, generate a random secret yourself; it is not issued by a cloud console. External HTTP/SDK clients use the same token to authenticate to the template service. The CLI starts the service and checks its actual application endpoint. Python connects to the returned sandbox ID; its provider API does not build source images. See the [launch guide](https://github.com/Alibaba-Agent-Sandbox/agent-sandbox/blob/main/docs/en/guide/template-launch.md).

自定义应用令牌可自行生成随机密钥，无需到云控制台申请；外部 HTTP/SDK 客户端使用同一令牌调用模板服务。CLI 负责启动服务并检查实际访问端点；Python 连接返回的沙箱 ID，其 provider API 不负责构建源码镜像。见[启动指南](https://github.com/Alibaba-Agent-Sandbox/agent-sandbox/blob/main/docs/zh/guide/template-launch.md)。

Successful launches keep their sandbox and image for use. Delete the sandbox when finished; remove the exact owned image tag from your registry when it is no longer needed. On failure, consult the CLI resource journal before retrying an uncertain submission.

启动成功后保留沙箱和镜像供使用。用完删除沙箱，不再需要镜像时清理本次所属标签；提交结果不明确时，先检查 CLI 资源记录再重试。

Native interpreter APIs and project `run_code` are different interfaces. This adapter has no `code.*` implementation; named application commands and PTY do not require it. [Executed checks](../../docs/acceptance.md) state their backend and tested scope.

原生解释器与本项目 `run_code` 是不同接口。本适配器尚未接入 `code.*`；模板命名命令和 PTY 不依赖它。[实测记录](../../docs/acceptance.md)列出对应后端与范围。
