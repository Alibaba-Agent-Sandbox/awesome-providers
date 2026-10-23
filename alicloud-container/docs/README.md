# 阿里云智能体沙箱容器版

**状态：Beta。** 本提供方暂未完成正式版验收。已声明的能力不等于已通过真实后端端到端测试；其他提供方的验收范围见[验收说明](../../docs/acceptance.md)。局部测试结果不会自动升级此状态。

目录提供方，id 是 `alicloud-container`。这不是极速版 `alicloud-express`。它是 ACS 或 ACK 上的 OpenKruise Agents sandbox-manager，说的是 E2B 形状的 HTTP。类型 `node`（`provider.mjs`，由宿主进程加载）。CLI 和所有 SDK 都能用：CLI 直接运行，SDK 经由本机引擎（`abx provider engine serve`）。

总说明：[工作原理](../../docs/zh/principle.md) · [安装](../../docs/zh/install.md)

## 安装和调用

```bash
export ABX_ALICLOUD_CONTAINER_DOMAIN=sbx.example.com
export ABX_ALICLOUD_CONTAINER_API_KEY=REPLACE_ME
abx provider install alibaba-agent-sandbox/awesome-providers//alicloud-container --allow-unpinned --yes   # 或 Python：python -m agent_sandbox.providers install registry:alicloud-container --yes（索引上线后）
abx --provider alicloud-container create --template code-interpreter
```

```python
from agent_sandbox.api.sandbox import Sandbox

sb = await Sandbox.create(
    provider="alicloud-container",
    template="code-interpreter",
    provider_options={
        "domain": "sbx.example.com",
        "api_key": "REPLACE_ME",
        "protocol": "native",
    },
)
```

已有模板可以直接传 SandboxSet 名称；自动准备可通过下方的新入口完成，不要求手查 ID。文档示例是 `code-interpreter`，不是极速版的 `base`。

## 配置

| 项 | 环境变量 | 说明 |
|---|---|---|
| 域名 | `ABX_ALICLOUD_CONTAINER_DOMAIN` | 必填，除非 `base_url` 已经给了源站 |
| API 源站 | `ABX_ALICLOUD_CONTAINER_BASE_URL` | 可省略 |
| API Key | `ABX_ALICLOUD_CONTAINER_API_KEY` | 请求头 `X-API-Key`。不读 `ABX_SANDBOX_API_KEY` |
| 协议 | `ABX_ALICLOUD_CONTAINER_PROTOCOL` | `native`（默认）或 `private` |

`native`：API 是 `https://api.{domain}`，数据面是 `https://{port}-{id}.{domain}`。创建响应里没有 `envdUrl` 时，适配器补 `https://49983-{id}.{domain}`。集群的 envd 端口如果不是 49983，命令会连错主机。

`private`：API 是 `https://{domain}/kruise/api`，数据面是 `https://{domain}/kruise/{id}/49983`，端口 URL 是 `https://{domain}/kruise/{id}/{port}`。

## 这个适配器会打的路径

| 能力 | 请求 |
|---|---|
| `sandbox.lifecycle` | `POST /sandboxes`、查询、列表、`DELETE`。`connect` 先 POST，4xx 再 GET。列表也会打 `GET /v2/sandboxes` |
| `sandbox.timeout` | `POST /sandboxes/{id}/timeout` |
| `sandbox.pause` | `POST /sandboxes/{id}/pause` 和 `POST /sandboxes/{id}/resume` |
| `exec.run`、`exec.stream` | envd `POST /process.Process/Start`，`stdin: false` |
| `process.manage` | envd 的进程列表、标准输入和信号 |
| `files.rw` | envd 的读、写、列目录、移动和删除 |
| `code.interpret` | Jupyter `POST /execute`，端口 49999，读 ndjson。不是 envd 的 CodeInterpreter RPC |
| `ports.url` | 按上面的 native 或 private 规则在本地计算 |

## 会抛出 E8004 的调用

`files.watch`、`files.transfer`、`templates.read`、`ports.domain`、`storage.mount`、`network.vpc`、`sessions`。

sandbox-manager 没有 `/terminal`。PTY 要走带 `pty` 字段的进程启动，这个适配器还没接，所以清单不声明 `pty`。官方说明里，预签名上传下载、日志、指标和卷也不在容器版的 E2B 兼容范围内。

## 实测

单元测试打的是本机假 API（`cli/tests/test_providers/test_node_plugins.test.ts`）。真实 sandbox-manager 需要同时设置 `ABX_ALICLOUD_CONTAINER_DOMAIN` 和 `ABX_ALICLOUD_CONTAINER_API_KEY`。这台环境没有 ACS/ACK 集群，所以真实创建没有执行。没有这两项时，测试只确认适配器在发请求前拒绝，不会把极速版密钥发出去。

## English

Catalog provider, id `alicloud-container`. This is the ACS/ACK OpenKruise Agents sandbox-manager, not Express (`alicloud-express`). Kind `node` (`provider.mjs`, loaded by the host). It runs from the CLI and from every SDK (through the local engine, `abx provider engine serve`).

```bash
export ABX_ALICLOUD_CONTAINER_DOMAIN=sbx.example.com
export ABX_ALICLOUD_CONTAINER_API_KEY=REPLACE_ME
abx provider install alibaba-agent-sandbox/awesome-providers//alicloud-container --allow-unpinned --yes   # or, Python only once the index is live: python -m agent_sandbox.providers install registry:alicloud-container --yes
```

| Setting | Environment |
|---|---|
| Domain | `ABX_ALICLOUD_CONTAINER_DOMAIN` |
| API origin, optional | `ABX_ALICLOUD_CONTAINER_BASE_URL` |
| API key, header `X-API-Key` | `ABX_ALICLOUD_CONTAINER_API_KEY` |
| `native` or `private` | `ABX_ALICLOUD_CONTAINER_PROTOCOL`, default `native` |

`native` uses `https://api.{domain}` and `https://{port}-{id}.{domain}`. `private` uses `https://{domain}/kruise/api` and `https://{domain}/kruise/{id}/49983`. It does not read `ABX_SANDBOX_API_KEY`.

Declared: `templates.build` (node/1 project preparation), `sandbox.lifecycle`, `sandbox.timeout`, `sandbox.pause`, `exec.run`, `exec.stream`, `process.manage`, `files.rw`, `code.interpret`, `ports.url`. `run_code` is Jupyter `POST /execute` on port 49999. `pty` is not declared; sandbox-manager has no `/terminal`.

Unit tests use a local fake API. A live create needs both the domain and the API key. This environment has no ACS/ACK cluster, so that create did not run. The example template id is `code-interpreter`, not Express `base`.

## 自动准备项目（Beta） / Automatic project preparation (Beta)

使用包含 `template launch` 和 `kit.project` 的 CLI 源码版，安装或更新本插件后运行：

```sh
abx --provider alicloud-container template launch alibaba-agent-sandbox/awesome-templates//python-hello --yes
```

提供方现在声明 `templates.build`，用于 node/1 管理器的 `prepareProject`。CLI 自动把适配器返回的 ID、名称或镜像传给创建，启动服务并验证就绪；缺少模板声明的运行时能力时，在构建前拒绝。正常沙箱行为不变。

Use a CLI source build containing `template launch` and `kit.project`. The node/1 `prepareProject` manager is guarded by `templates.build`. The exact returned native reference is handed to sandbox creation. Missing runtime capabilities fail before build. Normal sandbox operations remain unchanged.

先配置 Docker 登录、可写 `ABX_ALICLOUD_CONTAINER_IMAGE_REPOSITORY`、kubectl 与 `ABX_ALICLOUD_CONTAINER_KUBE_NAMESPACE`；命名空间须与 API Key 一致。`build_template` 默认 `code-interpreter`，多容器时设置 `build_container`，可显式设置 `kube_context`。适配器读取基础 SandboxSet 镜像并克隆运行时注入、卷及探针，只更换主容器镜像和资源；不修改基础对象。生成的零副本池通过 create-on-no-stock 创建，引用由适配器自动返回。需要集群权限，普通 sandbox-manager API Key 本身不提供创建 SandboxSet 的权限。

Configure Docker login, a writable `ABX_ALICLOUD_CONTAINER_IMAGE_REPOSITORY`, kubectl access and `ABX_ALICLOUD_CONTAINER_KUBE_NAMESPACE` matching the API key. `build_template` defaults to `code-interpreter`; select `build_container` when ambiguous and optionally `kube_context`. The adapter clones the base SandboxSet's runtime injection, volumes and probes, replacing only the main image/resources. It never edits the base. It returns an owned zero-pool name and uses create-on-no-stock. Kubernetes access is required; a normal sandbox-manager key does not itself grant SandboxSet creation.

所有新路径保持 Beta；原生 E2B、Cube、集群验收仍按维护者要求暂缓。单元/回环/实际 SDK 测试不能当成云验收。临时目录会清理；成功沙箱、镜像和已登记模板不会自动删除，可能继续计费。准备超时可能遗留已提交产物，启动/就绪失败会尝试删除本次新建沙箱并报告清理状态。源码安装、引用契约及完整限制见[指南](https://github.com/Alibaba-Agent-Sandbox/agent-sandbox/blob/main/docs/zh/guide/template-launch.md)。

All new paths remain Beta. Native E2B/Cube/cluster acceptance is explicitly deferred by the maintainer; unit/loopback/official SDK protocol tests are not cloud acceptance. Temporary staging is cleaned. Successful sandboxes, images and registered templates are retained and may incur cost. Preparation timeout may leave submitted artifacts; startup/readiness failure attempts cleanup of this invocation's new sandbox. See the [host guide](https://github.com/Alibaba-Agent-Sandbox/agent-sandbox/blob/main/docs/en/guide/template-launch.md) for installation, reference contracts and limits.
