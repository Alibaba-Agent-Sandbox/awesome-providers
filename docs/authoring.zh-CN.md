# 编写一个 provider

[English](authoring.md)

Provider 是可安装的沙箱后端。本仓库里一个目录就是一个 provider。Python SDK 和 `abx` CLI 不包含具体实现；它们把这里的目录安装到 `~/.abx/providers/<id>`，再和它通信。

后端是真实 HTTP 服务时，复制 [opensandbox/](../opensandbox/)。想要最小的 exec 插件时，复制 Python SDK 里的 `examples/providers/local-process/`。

## `abx create` 如何调用到你的插件

`abx create` 不会 import 你的代码。它调用 `Sandbox.create`。这次调用在访问任何沙箱 API 之前先选定 provider。

```text
abx --provider my-cloud create --template base
        │
        │  1. CLI 从命令行取出 --provider 和 --opt（任意位置），
        │     只在本次进程内保存。
        ▼
Sandbox.create({ template, timeout, envs, metadata, ... })
        │
        │  2. provider id，先匹配到的生效：
        │     provider= 参数
        │     > --provider
        │     > ABX_PROVIDER
        │     > ./.env  >  ~/.abx/.env
        │     > ~/.abx/config.toml 的 [core] provider
        │     > alicloud-express
        ▼
   是 alicloud-express？ ── 是 ──► 内置阿里云客户端。你的插件不会启动。
        │
        否
        ▼
   3. 读取 ~/.abx/providers/my-cloud，校验目录摘要（文件被改过则是 E8011）。
      摘要失败时不启动进程。
        ▼
   4. 启动清单里的 command。工作目录是插件目录。
      环境变量被裁剪：PATH、locale、ABX_PROVIDER_DATA_DIR，
      以及清单点名的那些变量。
        ▼
   5. initialize → 插件返回 features。
        ▼
   6. sandbox.create → 带 sandbox_id 的 SandboxRecord。
        ▼
   7. CLI 打印 my-cloud:<sandbox_id>。之后的 exec / 文件 / kill
      都用这个 id。没声明的能力返回 E8004，对应方法不会发出。
```

Python 的 `ProviderSandbox.create(template="base", provider="my-cloud")`（`from agent_sandbox import ProviderSandbox`） 从第 2 步开始，用的是同一个已安装目录。

下面两条不会进入你的插件：

- 没有选定 provider 时的 `abx create --template base`。那是 `alicloud-express`。
- `abx create "一个 node 服务"` 这种带描述、没有 `--template` 的命令。CLI 会先走内置的模板编写流程（生成、构建、部署）。只有最后一次创建使用选中的 provider。启动插件用 `abx --provider my-cloud create --template <镜像或名称>`。

## 你要提交的文件

```text
my-cloud/
  abx-provider.toml    必需
  provider.mjs         或 provider.py，与 [runtime] command 一致
  README.md            写明能用什么、什么返回 E8004、如何配置
```

`exec` 插件是一个进程，在 stdin/stdout 上说 JSON-RPC 2.0，每行一个 JSON 对象。安装插件时不会跑 npm 或 pip。`rest` 插件只有清单：一个 E2B 协议的 base URL。

只声明你完整实现的能力。宿主会发送的方法以 CLI 仓库的 `docs/design/fixtures/epp-methods.json` 为准。

| 能力 | 必须响应的方法 |
|---|---|
| （始终） | `initialize`、`shutdown` |
| `sandbox.lifecycle` | `sandbox.create`、`sandbox.get`、`sandbox.list`、`sandbox.kill`。`sandbox.connect` 可选（`-32601` 时宿主改调 `sandbox.get`） |
| `sandbox.timeout` | `sandbox.set_timeout` |
| `sandbox.pause` | `sandbox.pause`、`sandbox.resume` |
| `exec.run` | `exec.run` |
| `exec.stream` | `exec.start`，然后通知 `exec.output` 和唯一的 `exec.exit` |
| `process.manage` | `process.list`、`process.kill`、`process.signal`、`process.stdin` |
| `files.rw` | `files.read`、`files.write`、`files.list`、`files.stat`、`files.mkdir`、`files.remove`、`files.move` |
| `ports.url` | `ports.url` |

`sandbox.create` 的参数：`template`、`timeout`、`metadata`、`envs`、`cpu`、`memory`、`disk`、`gpu`、`request_timeout`；调用方设置了才有 `secure` 和 `options`。返回值必须有 `sandbox_id`。有则一并返回 `template`、`status`、`metadata`、`envd_url` 或 `url`、`envd_access_token`、`created_at`、`expires_at`、`region`。

没有 `envd_url` 时，宿主继续用 EPP（`epp://<provider>/<sandbox_id>`）。`envd_url` 是 `http(s)` 时，之后的文件、进程和终端走 E2B envd，不再回到你的进程。

## 开发

```bash
abx provider install ./my-cloud --link --yes
abx provider doctor my-cloud
abx provider test my-cloud
abx --provider my-cloud create --template base
abx exec my-cloud:<id> "echo hello"
```

`--link` 是开发用的符号链接，跳过摘要校验，并且每次使用都会在 stderr 警告。正式安装会复制文件，并在每次启动时校验摘要。

配置只出现在 `initialize.config` 里。密钥字段不能用 `--opt`（会进 shell 历史）。用户用 `abx config set providers.<id>.<key>` 设置。

## 加入本目录

1. 目录名等于 `[provider].id`。
2. 在 [`awesome-providers.yaml`](../awesome-providers.yaml) 增加一条：`name`、`path`、`description`、`kind`、`license`、`status`。 同时更新源 `index.json`；Registry 当前通过它选择打包目录，本地 Python 安装也使用它。
3. README 写明哪些 CLI 命令和 SDK 方法可用，哪些返回 E8004，哪些只是部分可用。
4. 提交 pull request。从目录安装：`abx provider install alibaba-agent-sandbox/awesome-providers//my-cloud`。

## 给 AI

改插件之前，把 [`SKILL.md`](../SKILL.md)（`name: awesome-providers`）装进编码工具。它和本页是同一套规则，只是写成 agent 会加载的形式：代码放哪、create 的调用链、方法名、以及要跑的检查。

See [exact workflow operations](workflows.md) ([中文](workflows.zh-CN.md)).
