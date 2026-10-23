# 创建一个提供方

一个提供方是一个目录：`abx-provider.toml`，再加上这种运行时需要的程序。不要把它放进 SDK 或 CLI 仓库。新的后端放在本目录的一个新子目录里，并在 `index.json` 加一条。

先选运行时。三种都安装到 `~/.abx/providers/<id>`。CLI 与 Python ProviderSandbox 通过提供方引擎调用它们；其他客户端需要明确桥接，Node.js 服务 HTTP 客户端不管理提供方。

| Kind | 你要写的 | 什么时候用 |
|---|---|---|
| `rest` | 只有清单 | 后端就是 E2B HTTP：`POST /sandboxes`，正文 `templateID`，头 `X-API-Key` 或 bearer，envd 在 `https://{port}-{id}.{domain}` |
| `exec` | 清单加一个进程 | API 不是 E2B 形状。任意语言。进程说 EPP/1。安装时不执行 |
| `node` | 清单加 `provider.mjs` | 后端是 E2B 形状但需要小改动（代理拨号、可选令牌、不同路径）。一个 ES 模块，由宿主进程通过 kit 加载 |

不要从极速版引擎抄。不要读 `ABX_SANDBOX_API_KEY`。那是极速版的密钥。

## 目录

```text
my-cloud/
  abx-provider.toml
  provider.mjs         # 只有 kind = "node" 需要
  README.md            # 这个提供方自己的说明
```

`exec` 插件把可执行文件放在同一目录，清单的 `command` 用相对路径。可执行文件必须留在插件目录里，不能是 `.bat`、`.cmd`、`.ps1`。

## Id

匹配 `^[a-z][a-z0-9]*(-[a-z0-9]+)*$`，长度 2 到 40。

不能用：

- 保留 id：`alicloud-express`、`default`、`all`、`none`、`builtin`、`shortcuts`、`core`、`transport`、`providers`
- 保留前缀：`abx-`、`alicloud-`、`shortcuts`
- 已经在官方目录里的 id：`opensandbox`、`cubesandbox`、`e2b`、`alicloud-container`

`alicloud-container` 能安装，是因为安装器对官方目录 id 放行。新的阿里云后端不能再以 `alicloud-` 开头。

## 清单

密钥字段名用 `api_key`。环境变量由 id 推导，不用在清单里再写一遍，除非你还要接受厂商原来的变量名（`env = [...]`）。

```toml
manifest_version = 1
operation_contract_version = 1

[provider]
id = "my-cloud"
name = "My Cloud"
name_zh = "我的云"
version = "0.1.0"
description = "这个后端是什么。"
license = "Apache-2.0"

[compat]
protocol = "node/1"
requires = { sdk = ">=0.3", cli = ">=0.3" }

[runtime]
kind = "node"
entry = "provider.mjs"

[features]
supported = [
  "sandbox.lifecycle",
  "exec.run",
  "files.rw",
]

[operations]
cli = ["sandbox.create", "sandbox.get", "sandbox.list", "sandbox.delete", "exec.run", "files.read", "files.write", "files.list", "files.stat", "files.remove", "files.move"]
python = ["sandbox.create", "sandbox.get", "sandbox.list", "sandbox.delete", "exec.run", "files.read", "files.write", "files.list", "files.stat", "files.remove", "files.move"]

[workflow]
inputs = ["managed"]
startups = ["exec", "none"]

[security]
network = ["api.example.com"]

[auth]
any_of = [["api_key"]]

[config.fields.api_key]
type = "string"
secret = true
credential = true
description = "API key. Set ABX_MY_CLOUD_API_KEY."
description_zh = "API 密钥。设置 ABX_MY_CLOUD_API_KEY。"

[core]
inherit = []
```

`rest` 把 `protocol` 改成 `e2b-rest/1`，`kind` 改成 `rest`，并写上 `[endpoint]`：

```toml
[runtime]
kind = "rest"

[endpoint]
base_url = "https://api.example.com"
domain = "sandboxes.example.com"
auth = { scheme = "header", header = "X-API-Key" }
```

`domain` 是 `https://49983-{sandboxID}.{domain}` 的后缀。创建响应里如果有 `envdUrl`，用那个值。

`exec` 把 `protocol` 改成 `epp/1`，并写 `command`：

```toml
[runtime]
kind = "exec"
command = ["node", "./provider.mjs"]
startup_timeout_ms = 10000
call_timeout_ms = 60000
```

`[security]` 是同意界面上的说明，运行时不强制隔离。按真实会访问的网络和文件写。

## Feature 元信息

未知 id 在安装时被拒绝。没声明的调用在发请求前抛 `E8004`。

```
sandbox.lifecycle   创建、列表、查询、连接、销毁
sandbox.timeout     set_timeout
sandbox.pause       暂停和恢复
exec.run            commands.run
exec.stream         commands.stream
process.manage      进程列表、标准输入、信号
pty                 get_terminal
files.rw            读、写、列目录、移动、删除
files.watch         files.watch
files.transfer      upload_url / download_url
templates.read      模板列表
templates.build     模板构建
ports.url           network.resolve_url
ports.domain        单独的域名能力
storage.mount       卷挂载
network.vpc         VPC
sessions            沙箱内具名命令
```

只声明后端真的实现了的。声明了却 404，比 `E8004` 更糟，因为调用方以为请求已经发出去了。

精确工作流操作需单独声明；参见[操作契约](../workflows.zh-CN.md)。Feature 元信息不能授予解释器实现。

## Node 入口

```js
export default function create(kit) {
  return {
    async buildInfra(ctx) {
      const base_url = String(ctx.options.base_url || "https://api.example.com");
      const auth = ctx.headerKeyAuth(String(ctx.options.api_key), "X-API-Key");
      const http = ctx.http({ base_url, domain: "example.app", auth });
      return {
        operation_contract_version: 1,
        operations: { cli: ["sandbox.create", "sandbox.get", "sandbox.list", "sandbox.delete", "exec.run", "files.read", "files.write", "files.list", "files.stat", "files.remove", "files.move"], python: ["sandbox.create", "sandbox.get", "sandbox.list", "sandbox.delete", "exec.run", "files.read", "files.write", "files.list", "files.stat", "files.remove", "files.move"] },
        workflow_inputs: ["managed"], startup_modes: ["exec", "none"],
        auth,
        http_client: http,
        endpoint: { base_url, domain: "example.app" },
        sandbox_protocol: new kit.SandboxProtocol(http),
        process_protocol: new kit.ProcessProtocol(http),
        filesystem_protocol: new kit.FilesystemProtocol(http),
        code_interpreter_protocol: {
          async runCode() { throw new kit.errors.ProviderFeatureNotSupportedError("my-cloud", "code.execute"); },
        },
      };
    },
  };
}
```

宿主传入 `kit` 和 `ctx`：`ctx.options` 只含你在 `[config.fields.*]` 下声明的字段，`ctx.core` 是你 inherit 的通用键。宿主按声明的能力给每个协议加闸，未声明的方法会在请求前变成 `E8004`。要改某一个调用，用 `kit.e2b.overlay(inner, { method })` 包一层，或继承协议类（见 `cubesandbox/provider.mjs`）。`buildInfra` 还可以返回 `envd_dial: [host, port]` 和 `envd_auth: { allow_missing, basic_user }`，用于走代理、或 envd 令牌可有可无的后端。

`exec` 进程在 `initialize` 里收配置，不要自己读父进程环境。密钥只从 `initialize` 来。方法表和错误码见 CLI 的 [Authoring Providers](https://github.com/alibaba-agent-sandbox/python-sdk/blob/main/docs/en/guide/authoring-providers.md) 里 EPP/1 那一节；同一份约定也写在本目录的 [authoring.md](../authoring.md)。

## 放进目录索引

`index.json` 的 `providers` 加一条：

```json
{ "id": "my-cloud", "version": "0.1.0", "url": "my-cloud" }
```

`url` 相对索引文件时，指向旁边的目录。本仓库就是这样，方便 `ABX_PROVIDER_REGISTRY` 指到这份 `index.json` 做本地安装。

发布到 `https://registry.agent-sandbox.cn/providers/index.json` 时，`url` 应是一个 `.tar.gz`。安装器把 http(s) 响应当 tar 包解压；写了 `sha256` 就会核对。本地目录不走 tar。
