# 提供方怎么工作

提供方是一个沙箱后端。`Sandbox.create`（或 `abx create`）先选定提供方，再由它建立控制面和数据面。SDK 和 CLI 只把 `alicloud-express`（阿里云极速版）编译进去。其余提供方在本目录，安装之后才加载。

提供方这一层只用 Node.js 写一次，由 TypeScript 的 CLI 承载。CLI 直接使用它；Python ProviderSandbox 通过本机引擎（`abx provider engine serve`，`127.0.0.1` 上的 HTTP + SSE + WebSocket）调用目录提供方。每种语言桥接都须实现其声明的具体操作；Node.js 服务 HTTP 客户端属于独立接口，不管理云端提供方。宿主、四种类型和引擎的规格在 [Node 提供方架构](https://github.com/Alibaba-Agent-Sandbox/agent-sandbox/blob/main/docs/zh/design/node-provider-architecture.md)。

## 内置和目录

| Id | 放在哪里 | 类型 |
|---|---|---|
| `alicloud-express` | SDK 和 CLI 内置 | `builtin` |
| `opensandbox` | `awesome-providers/opensandbox` | `node`：EPP 方法在宿主进程内运行（`kit.epp.infra`） |
| `cubesandbox` | `awesome-providers/cubesandbox` | `node`：宿主加载的 ES 模块 |
| `e2b` | `awesome-providers/e2b` | `node` |
| `alicloud-container` | `awesome-providers/alicloud-container` | `node` |

安装用 `abx provider install alibaba-agent-sandbox/awesome-providers//<id>`（CLI，从 git 树）或 `python -m agent_sandbox.providers install registry:<id> --yes`（Python，需要已发布的索引）。两者写入同一个 `~/.abx/providers/<id>` 目录，之后两边运行的是同一份代码。Python SDK 用 `Sandbox.create(provider="…")` 调用目录提供方，CLI 用 `abx --provider <id> create`。

`alicloud-express` 是保留 id，不能安装成插件。`opensandbox`、`cubesandbox`、`e2b`、`alicloud-container` 是官方目录 id，可以安装，不能再拿去登记成另一个插件。

## 一次调用怎么选到提供方

优先级从高到低：

1. `Sandbox.create(provider="…")`，或 CLI 的 `--provider`
2. 进程环境变量 `ABX_PROVIDER`
3. `./.env`
4. `~/.abx/.env`
5. `~/.abx/config.toml` 里的 `[core] provider`（`abx provider default` 写入）
6. `alicloud-express`

沙箱 id 属于创建它的那个提供方。`connect` 可以收 `my-cloud:sbx-1` 这种带前缀的引用，前缀就是提供方。前缀和 `provider=` 冲突时是 `ProviderMismatchError`（E8030）。

## 加载

`get_provider` 按这个顺序找：

1. id 是 `alicloud-express`：返回内置对象。
2. 本进程里 `register_provider` 登记过的对象。
3. 分发包入口点 `agent_sandbox.providers`。
4. `~/.abx/providers/<id>` 里的已安装插件。

已安装插件再按清单分叉。在 CLI 里由宿主直接运行。在 Python SDK 里，`node` 插件经由引擎（`EngineProvider`），返回的沙箱是形如 `engine://<provider>/<id>` 的标记，SDK 的适配器把它翻译成引擎调用。`rest` 和 `exec` 留在 Python 进程里：

| `runtime.kind` | 协议 | 宿主做什么 |
|---|---|---|
| `rest` | `e2b-rest/1` | 只读清单。用内置 HTTP 客户端打 E2B 形状的控制面，数据面打 envd |
| `exec` | `epp/1` | 启动清单里的进程，stdin/stdout 上走 JSON-RPC。安装时不执行插件 |
| `node` | `node/1` | 在宿主进程里导入清单 `entry`（默认 `provider.mjs`），调用它的默认导出 `create(kit)`。返回的 `buildInfra(ctx)` 交出协议对象。除非用 `--link` 安装，每次加载都校验目录摘要 |

从清单安装的 Python 插件（`kind = "python"`）已不存在。代码里仍可写 Python `Provider` 子类并用 `register_provider` 登记。

`build_infra` 交出 `ProviderInfra`：沙箱、进程、文件、代码解释器四组协议对象。之后的 `commands.run`、`files.write`、`run_code` 都打在这些对象上，不再另开一套客户端。

未声明的能力在发请求之前被挡住，错误码 `E8004`（`ProviderFeatureNotSupportedError`）。`exec` 在写给插件之前挡，`rest` 和 `node` 用 `feature_gate` 包住协议方法。声明了但后端失败，不是 `E8004`，那是后端自己的错误。

## 一次创建

```text
Sandbox.create(provider="e2b", template="base", timeout=300)
    │
    ├─ 解析密钥和地址（provider_options，然后是 ABX_<ID>_*）
    ├─ provider.build_infra(config)
    ├─ 控制面 POST /sandboxes（各家路径见该提供方自己的文档）
    └─ 之后的命令和文件走这次建好的协议对象
```

`timeout` 是沙箱寿命，不是 HTTP 超时。

OpenSandbox 不用那个 HTTP 客户端。它的模块自己打 OpenSandbox 的 HTTP 和每个沙箱里的 execd（SSE 和 WebSocket），宿主在进程内调用它的 EPP/1 分发器，再适配成协议对象。

## 密钥不会串

每个提供方读自己的 `ABX_<ID>_API_KEY`（id 大写，`-` 换成 `_`）。`my-cloud` 读 `ABX_MY_CLOUD_API_KEY`。

`[core] inherit` 才会收到极速版那一组通用键（`sandbox_api_key`、`sandbox_base_url`、`sandbox_domain`），而且安装时要用户同意。默认留空。极速版的 `ABX_SANDBOX_API_KEY` 不会发给 E2B、CubeSandbox 或容器版。

OpenSandbox 的清单同样不 inherit 任何键，它读 `ABX_OPENSANDBOX_API_KEY` 和 `ABX_OPENSANDBOX_BASE_URL`。

## 后台检查更新

`list_providers` 会调用 `schedule_update_check()`。它起一个守护线程，拉取索引，把已安装版本和索引里的 `version` 比较，有差异就写 `~/.abx/providers/updates.json`。它不下载、不替换已安装的文件。网络失败就当没有更新。

下面两种情况不检查：

- 环境变量 `ABX_PROVIDER_UPDATE_CHECK=0`
- 进程在 pytest 里（`PYTEST_CURRENT_TEST`）

索引地址默认是 `https://registry.agent-sandbox.cn/providers/index.json`。`ABX_PROVIDER_REGISTRY` 可以改成别的 URL，或本机的 `index.json` 路径。给人看的注册站是 <https://registry.agent-sandbox.com>。官网是 <https://www.agent-sandbox.com>。
