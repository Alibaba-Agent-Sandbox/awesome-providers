# 安装一个提供方

安装把文件放进 `~/.abx/providers/<id>` 并写回执。没有安装钩子。文件就位后会构建一次提供方（握手）；加载失败会把目录撤回去。缺 API key 或域名是配置问题，不是安装失败：目录留下，第一次 `create` 再报缺什么。`--no-verify` 跳过握手。Git 来源也不做 `git checkout`，安装器自己把文件写下来。

## 从官方目录

```bash
abx provider install alibaba-agent-sandbox/awesome-providers//opensandbox --allow-unpinned --yes
abx provider install alibaba-agent-sandbox/awesome-providers//cubesandbox --allow-unpinned --yes
abx provider install alibaba-agent-sandbox/awesome-providers//e2b --allow-unpinned --yes
abx provider install alibaba-agent-sandbox/awesome-providers//alicloud-container --allow-unpinned --yes
```

没有终端时必须加 `--allow-unpinned`（`main` 会移动）；要固定版本就改用 `--ref <40 位提交>`。

Python 安装器也能从索引安装：`python -m agent_sandbox.providers install registry:<id> --yes` 先读索引，再把该条变成一个本地目录，然后走普通安装。只有 Python 安装器有 `registry:` 写法（`abx` 没有），而且公开索引还没发布，所以请用上面的 git 写法，或下面的本地索引。两者写入同一个目录，装好之后插件的运行方式一样。

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

四个官方提供方都是 `node`。安装之后，CLI（`abx --provider e2b create`）和 Python SDK 都能调用：

```python
import asyncio
from agent_sandbox import Sandbox

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

任何类型安装之后，CLI 和 SDK 都能用：`abx --provider my-cloud create --template base`。Python SDK 需要时会启动本机引擎（`abx provider engine serve`），所以 SDK 调用 `node` 或 `exec` 提供方时，`abx` 要在 `PATH` 里（或用 `ABX_BIN` 指定）。
