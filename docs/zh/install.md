# 安装一个提供方

提供方安装一次后，CLI 和 Python `ProviderSandbox` 都可以使用。目录中的四个提供方（`opensandbox`、`e2b`、`cubesandbox`、`alicloud-container`）均使用 Node 运行时，Python 调用时也一样。独立 `abx` 二进制已经内嵌该运行时，使用它时无需另装 Node.js。

## 环境要求

| 使用方式 | 客户端要求 |
|---|---|
| Python SDK 调用目录提供方 | Python 3.10+、Python SDK、`abx` 和已安装的提供方 |
| 独立 `abx` 二进制 | 支持的 Linux/macOS x64 或 arm64，或 Windows x64；无需另装 Node.js、npm |
| npm 安装 `abx` | Node.js 20+ 和 npm；OpenSandbox 交互终端需要 Node.js 22+ |
| 从 Git 安装提供方 | 在所选客户端之外还需要 Git |
| Python `registry:<id>` 安装 | 能访问索引和下载包；不需要 Git |

还需有可访问的后端服务及其要求的凭据。连接已有的远端 OpenSandbox 服务不要求客户端安装 Docker；本机启动该服务或构建源码模板镜像时才需要 Docker。其他提供方的要求各不相同，创建资源前请阅读对应 README。

以上 Node 要求针对 `runtime.kind = "node"` 的目录提供方。内置极速版以及 Python 直接承载的 `rest`、`exec` 提供方使用不同调用路径；`exec` 提供方需要它自身命令所使用的运行时。

## Python 快速准备

macOS 或 Linux 推荐安装独立 CLI：

```bash
curl -fsSL https://www.agent-sandbox.cn/install.sh | sh
```

Windows 使用 PowerShell：

```powershell
irm https://raw.githubusercontent.com/Alibaba-Agent-Sandbox/agent-sandbox/main/install.ps1 | iex
```

按安装器提示配置 PATH，并检查 `abx --version`。支持的平台、指定版本、校验和与手动下载方法见[二进制安装指南](https://github.com/Alibaba-Agent-Sandbox/agent-sandbox/blob/main/docs/zh/guide/binary-installation.md)。可执行文件不在 PATH 中时，也可通过 `ABX_BIN` 指定，供 Python 查找。

在当前 Python 环境安装 SDK 和需要的提供方：

```bash
python -m pip install "agent-sandbox-client==0.4.0a6"
python -m agent_sandbox.providers install registry:opensandbox --yes
python -m agent_sandbox.providers doctor opensandbox
```

SDK、引擎和提供方是独立的安装项。`pip install agent-sandbox-client` 不会安装 `abx` 或目录提供方。准备完成后，后续 Python 程序复用已有引擎和提供方。安装 OpenSandbox 客户端提供方不会启动 OpenSandbox 服务。

已有 Node.js 环境时，也可以用 npm 代替二进制安装器：

```bash
npm install -g @agent-sandbox/cli@0.5.8 --registry=https://registry.npmjs.org
```

`abx` 的二进制与 npm 安装方式二选一，两者都提供 Python 所需的引擎。OpenSandbox 服务位于 `http://127.0.0.1:8080` 时，不需要导出地址。其他地址或已启用鉴权的服务请按 [OpenSandbox 配置说明](../../opensandbox/README.zh-CN.md#配置)设置。Python 安装命令中的 `opensandbox` 也可替换为其他提供方 ID。

## 从官方目录

```bash
abx provider install alibaba-agent-sandbox/awesome-providers//opensandbox --allow-unpinned --yes
abx provider install alibaba-agent-sandbox/awesome-providers//cubesandbox --allow-unpinned --yes
abx provider install alibaba-agent-sandbox/awesome-providers//e2b --allow-unpinned --yes
abx provider install alibaba-agent-sandbox/awesome-providers//alicloud-container --allow-unpinned --yes
```

没有终端时必须加 `--allow-unpinned`（`main` 会移动）；要固定版本就改用 `--ref <40 位提交>`。

Python 安装器也能从索引安装：`python -m agent_sandbox.providers install registry:<id> --yes` 先读索引，再把该条变成一个本地目录，然后走普通安装。只有 Python 安装器有 `registry:` 写法（`abx` 没有），可使用公开索引、上面的 git 写法，或下面的本地索引。两者写入同一个目录，装好之后插件的运行方式一样。

索引默认是 `https://registry.agent-sandbox.cn/providers/index.json`。给人看的注册站是 <https://registry.agent-sandbox.com>。官网是 <https://www.agent-sandbox.com>。安装器改地址：

```bash
export ABX_PROVIDER_REGISTRY=/path/to/awesome-providers/index.json
python -m agent_sandbox.providers install registry:opensandbox --yes
```

`ABX_PROVIDER_REGISTRY` 可以是 https URL、`file:` URL，或本机上已经存在的 `index.json` 路径。本仓库的索引用相对目录（`url` 是 `opensandbox` 这种）。指向这份文件时，安装器直接用旁边的目录。指向 https 索引时，`url` 必须是 tar.gz：安装器下载、可选地核对 `sha256`、解压，如果包里只有一个子目录且根上没有清单，就用那个子目录。

没有终端时要 `--yes`，否则 `E8012`。`--yes` 表示你已经看过同意界面，不是跳过校验。

## 从目录或 Git

```bash
python -m agent_sandbox.providers install ./my-cloud --yes
python -m agent_sandbox.providers install ./my-cloud --link --yes

python -m agent_sandbox.providers install \
  https://github.com/you/abx-provider-my-cloud.git \
  --ref <40-hex-commit> --yes
```

`abx provider install` 用同样的参数。两个工具都能安装 `rest`、`exec` 和 `node` 提供方。

钉死来源的方式是 40 位 commit（`--ref`）或 `--sha256 <目录树摘要>`。tag 和分支是未钉死的：只能在终端里由人看完同意界面后接受，或显式 `--allow-unpinned`。单独的 `--yes` 不会接受会移动的 ref，失败时会打印应该钉的 commit。

只接受 `https://` 和 ssh 的 Git URL。URL 里带用户名密码会被拒绝。`file://`、`http://`、`git://` 要 `--allow-insecure-transport`，只用于开发和测试。

## 装好以后

```text
~/.abx/providers/
  <id>/
    abx-provider.toml
    ...插件文件
    .abx-install.json     # 来源、commit、摘要、同意记录
    data/                 # 插件自己的状态，不进摘要
```

```bash
python -m agent_sandbox.providers list
python -m agent_sandbox.providers doctor opensandbox
python -m agent_sandbox.providers uninstall opensandbox
```

`uninstall` 删目录。`~/.abx` 里该 id 的配置还在，除非加 `--purge`。卸掉的如果是默认提供方，默认回到 `alicloud-express`。

已经装过同一个 id 时，再装要 `--force`。

## 更新检查和真正更新

列出提供方时，SDK 在后台比较索引里的 `version` 和回执里的版本，把差异写到 `~/.abx/providers/updates.json`。这只是通知。替换文件要用：

```bash
python -m agent_sandbox.providers update opensandbox --check
python -m agent_sandbox.providers update opensandbox --yes
```

关掉后台检查：`ABX_PROVIDER_UPDATE_CHECK=0`。

## 装上之后怎么调用

四个官方提供方都是 `node`。安装之后，CLI（`abx --provider e2b deploy --template-id base --name my-sandbox`）和 Python SDK 都能调用：

```python
import asyncio
from agent_sandbox import ProviderSandbox as Sandbox

async def main() -> None:
    async with await Sandbox.create(
        provider="opensandbox",
        template="base",
        timeout=300,
    ) as sb:
        print((await sb.commands.run("echo ok", timeout=30)).stdout)

asyncio.run(main())
```

各家要的环境变量写在该目录的 `docs/README.md`。没装就 `ProviderNotFoundError`，提示里会建议安装命令。

任何类型安装之后，CLI 和 SDK 都能用：`abx --provider my-cloud deploy --name my-sandbox --template-id base`。Python SDK 需要时会启动本机引擎（`abx provider engine serve`），所以 SDK 调用 `node` 提供方时，`abx` 要在 `PATH` 里（或用 `ABX_BIN` 指定）。`exec` 提供方由 Python 宿主直接运行清单中的命令，不经过该 Node 引擎。

## 调用原理与性能

```text
Python ProviderSandbox → 本机 abx 引擎 → 提供方 → 后端
abx CLI                → 提供方       → 后端
```

Python 通过本机 HTTP、SSE、WebSocket 连接引擎。引擎按需启动并持续复用，不会每次 SDK 调用都启动一个 Node 进程。命令执行和文件操作也经过这条路径。CLI 则直接在自身进程运行同一个提供方。不同提供方类型见[工作原理](principle.md)。

与直接访问同一后端的等价原生 Python 提供方相比，Node 提供方路径增加了本机通信、数据编解码和引擎进程的内存占用。首次调用还可能包含引擎启动与提供方加载。大响应和文件传输可能增加数据拷贝或编码，并发调用还会竞争引擎的 CPU 和连接资源。

完整 SDK 与提供方路径没有固定的单次开销或吞吐保证。创建后端资源、运行长命令时，后端耗时可能占主要部分；高频短命令和小文件操作更容易体现额外成本。应使用自己的实际操作和复用连接进行测量，分开观察启动耗时、持续调用延迟、并发、传输吞吐和内存。串行调用的额外耗时大致按“调用次数 × 单次额外耗时”累积。

独立二进制简化了安装，但仍使用本机引擎和相同的转发路径，不会将 Node 提供方变成原生 Python 提供方。
