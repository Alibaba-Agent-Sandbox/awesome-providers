# CubeSandbox

**状态：Beta。** 本提供方暂未完成正式版验收。已声明的能力不等于已通过真实后端端到端测试；当前仅阿里云极速版为正式版。局部测试结果不会自动升级此状态。

目录提供方，id 是 `cubesandbox`，类型 `node`（`provider.mjs`，由宿主进程加载）。CLI 和所有 SDK 都能用：CLI 直接运行，SDK 经由本机引擎（`abx provider engine serve`）。

总说明：[工作原理](../../docs/zh/principle.md) · [安装](../../docs/zh/install.md) · [审查里还没跑到的项](../../docs/zh/catalog.md)

## 安装和调用

```bash
abx provider install alibaba-agent-sandbox/awesome-providers//cubesandbox --allow-unpinned --yes   # 或 Python：python -m agent_sandbox.providers install registry:cubesandbox --yes（索引上线后）
abx --provider cubesandbox --opt base_url=http://127.0.0.1:3000 create --template base
```

```python
from agent_sandbox.api.sandbox import Sandbox

sb = await Sandbox.create(
    provider="cubesandbox",
    template="base",
    timeout=60,
    provider_options={"base_url": "http://127.0.0.1:3000"},
)
```

模板 id 用集群里真实存在的那个。不要假设一定有 `base`。

## 配置

| 字段 | 环境变量 | 默认 |
|---|---|---|
| CubeAPI 源站，不带路径 | `ABX_CUBESANDBOX_BASE_URL` | `http://127.0.0.1:3000` |
| 可选 `X-API-Key` | `ABX_CUBESANDBOX_API_KEY` | 不设置就不发送认证头 |
| 数据面域名后缀 | `ABX_CUBESANDBOX_DOMAIN` | `cube.app` |
| CubeProxy `主机:端口` | `ABX_CUBESANDBOX_PROXY` | 不设置。TCP 直连虚拟主机名 |

不读取 `ABX_SANDBOX_API_KEY`。

数据面默认是 `http://49983-{id}.{domain}`。主机名里的 `49983` 是 CubeProxy 的路由前缀，HTTP 在 80 端口，不是 https 的 443。创建响应里的 `domain` 优先于配置。不在节点上时设置 `ABX_CUBESANDBOX_PROXY`，TCP 打到代理，Host 仍是虚拟主机名。

## 这个适配器会打的路径

| 能力 | 请求 |
|---|---|
| `sandbox.lifecycle` | `POST /sandboxes`、`GET /sandboxes`、`GET /sandboxes/{id}`、`DELETE /sandboxes/{id}`。`connect` 先 `POST /sandboxes/{id}/connect`，4xx 再 GET |
| `sandbox.timeout` | `POST /sandboxes/{id}/timeout` |
| `sandbox.pause` | `POST /sandboxes/{id}/pause` 和 `POST /sandboxes/{id}/resume`。`resume` 的正文是 `{}` |
| `exec.run`、`exec.stream` | envd `POST /process.Process/Start`，默认 `user=root`，带 5 字节 Connect 帧和 `Connect-Protocol-Version: 1`。`stdin` 为 false |
| `files.rw` | envd 文件和目录方法，默认 `username=root` |
| `files.watch` | envd `WatchDir` |
| `code.interpret` | `http://49999-{id}.{domain}/execute`，正文 `code`、`language`、`env_vars`，响应按 ndjson 读 |
| `ports.url` | 本地算出 `{port}-{id}.{domain}` |

没有 `envdAccessToken` 时不发 `X-Access-Token`，也不在发请求前抛 `TokenExpiredError`。

## 会抛出 E8004 的调用

`process.manage`、`files.transfer`、`templates.read`、`ports.domain`、`storage.mount`、`network.vpc`、`sessions`。`pty` 也没有声明，宿主不会替它兜底。

OpenAPI 里还有卷、网络策略、分发范围，适配器不调用，清单里也不再登记。`GET /sandboxes` 忽略 `status` 和 `offset`，按状态过滤要等改打 `GET /v2/sandboxes`。

## 实测

单元测试打的是本机假 API（`cli/tests/test_providers/test_node_plugins.test.ts`），锁住的是上面这些路径、Connect 帧、代理拨号和可选令牌；Python SDK 经引擎的整条链路由 `python-sdk/client-sdk/tests/test_providers/test_engine_provider.py` 覆盖。这台环境没有 Cube 集群（端口 3000 没有 CubeAPI），所以真实创建没有执行。拿到集群之后按 [目录与审查](../../docs/zh/catalog.md) 里 Cube 那几行再跑一遍。

## English

Catalog provider, id `cubesandbox`, kind `node` (`provider.mjs`, loaded by the host). It runs from the CLI and from every SDK (through the local engine, `abx provider engine serve`).

```bash
abx provider install alibaba-agent-sandbox/awesome-providers//cubesandbox --allow-unpinned --yes   # or, Python only once the index is live: python -m agent_sandbox.providers install registry:cubesandbox --yes
```

| Field | Environment | Default |
|---|---|---|
| CubeAPI origin, no path | `ABX_CUBESANDBOX_BASE_URL` | `http://127.0.0.1:3000` |
| Optional `X-API-Key` | `ABX_CUBESANDBOX_API_KEY` | omitted when unset |
| Data-plane domain | `ABX_CUBESANDBOX_DOMAIN` | `cube.app` |
| CubeProxy `host:port` | `ABX_CUBESANDBOX_PROXY` | unset |

The data plane is `http://49983-{id}.{domain}`. The `49983` prefix is how CubeProxy routes; HTTP is port 80. It does not read `ABX_SANDBOX_API_KEY`. Process and file calls default the user to `root` and use a 5-byte Connect envelope. `run_code` is Jupyter `POST /execute` on port 49999, read as ndjson. `resume` sends `{}`.

`E8004`: `process.manage`, `files.transfer`, template read/delete APIs, `ports.domain`, `storage.mount`, `network.vpc`, `sessions`. `pty` is not declared either, and the host does not stand in for it. Volume, network policy, and distribution scope are not called and no longer listed in the manifest.

Unit tests hit a local fake API. This environment has no Cube cluster, so a live create did not run. Use a real template id from the cluster; do not assume `base` exists.

## 镜像转模板适配器（能力尚未启用）

`templates.mjs` 提供异步 `buildTemplates(ctx).deploy(input)`，使用原生 CubeAPI，
不使用 E2B 的 v3 Template SDK。独立的 `templates.deploy` 仍未在清单声明：安装此目录
不会使现有 CLI 模板命令可用。跟踪 [Issue #9](https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues/9)。

```js
await adapter.deploy({
  source: { kind: "image", image: "registry.example.com/runtime:v1" },
  name: "runtime",
  spec: { cpu: 2, memory: 2048 }, // CPU 为整核，内存 MiB
  timeout: 600, // 整个提交/轮询期限，最多 3600 秒
  // registry: { username, password },
  // signal: abortController.signal,
});
// { template_id, build_id, status: "ready", ref: image }
```

镜像须提前推送，并在镜像自己的入口中运行 envd，提供 `49983/health` HTTP 健康检查。
适配器固定暴露和探测端口 49983，探针路径 `/health`，可写层 1G。它不安装 envd、
不读取本地文件、不执行 Docker、不构建 Dockerfile，也不推送镜像。
`cpu` 转为 CubeAPI 毫核，`memory` 按 MiB 发送。

Cube 的 HTTP 探针无法无损表达共享合同的 shell `start_cmd` / `ready_cmd`，因此本适配器
会在请求前拒绝这两个字段。`name` 限小写字母、数字、连字符，最长 64 字符，不能以
`tpl-` / `snap-` 开头；命名空间和 tag 会被拒绝，防止 CubeAPI 静默丢弃它们。
其他未知字段、非镜像来源、URL 形式镜像（含明文 HTTP registry）也会拒绝。

适配器提交 `POST /templates`，检查返回的 `templateID` / `jobID`，再轮询
`GET /templates/{templateID}/builds/{jobID}/status`；只有该任务的 `status: "ready"` 才返回 ready。
对外状态端点将内部 `PENDING` / `RUNNING` / `BUILT` 映射为 `building`，`FAILED` 映射为
`error`；内部 `BUILT` 仍需等待分发和登记。构建请求不会自动重试，也不跟随重定向。
API origin 和可选密钥只取本 provider 的已解析配置，私有镜像凭证只放构建正文，
不读取环境里的其他提供方密钥；错误不输出后端正文或原始异常。取消和超时会中断等待，
已经提交的远端任务可能仍存在，不会擅自删除模板。

已对照官方源码
[CubeAPI models](https://github.com/TencentCloud/CubeSandbox/blob/e0c1820ac2132df08bd4912e614486717275b956/CubeAPI/src/models/mod.rs)、
[handlers](https://github.com/TencentCloud/CubeSandbox/blob/e0c1820ac2132df08bd4912e614486717275b956/CubeAPI/src/handlers/templates.rs)、
[services](https://github.com/TencentCloud/CubeSandbox/blob/e0c1820ac2132df08bd4912e614486717275b956/CubeAPI/src/services/templates.rs)。
对外状态转换见 [CubeMaster status handler](https://github.com/TencentCloud/CubeSandbox/blob/e0c1820ac2132df08bd4912e614486717275b956/CubeMaster/pkg/service/httpservice/cube/template_commit.go)。
这些是固定 revision 的接口依据，不是实集群验收。

运行 `node tests/run.mjs`（在 `cubesandbox/` 内）。2026-10-18：10 个 T0 测试通过，
包括真实 loopback HTTP 提交/轮询及 307 重定向不转发凭证回归；未启动官方 CubeAPI 或
KVM 集群，未实测 build/create/exec/kill。`tests/installed-host.mjs` 已对本机未发布新版
宿主执行临时 HOME 的安装/同意/派发验收（临时副本声明未来能力），并验证原生 loopback
请求、私仓凭证和返回值。可通过 `ABX_CLI_ENTRY=<已审查宿主的绝对入口> node tests/installed-host.mjs`
重跑。宿主/schema 的兼容交付和实际集群验收仍是启用能力前的门槛，不声明已发布版本支持。

## Image-to-template adapter (capability not enabled)

`templates.mjs` implements asynchronous `buildTemplates(ctx).deploy(input)` against
native CubeAPI. It does not use the E2B v3 Template SDK. `templates.deploy` remains
undeclared, so installing this directory does not enable existing CLI template
commands. See [Issue #9](https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues/9).

Input is `{source: {kind: "image", image}, name, spec?: {cpu, memory}, registry?:
{username, password}, timeout?, signal?}`; output is
`{template_id, build_id, status: "ready", ref}`. CPU integer cores convert to
millicores; memory is MiB. The image must already run envd at HTTP port 49983 with
`/health`. The adapter fixes exposed/probe port 49983 and a 1G writable layer; it
does not install envd, read local files, invoke Docker, build or push an image.

Shell `start_cmd` / `ready_cmd` cannot be represented by Cube's HTTP probe and are
rejected before I/O. Names must be lowercase alphanumeric/hyphen aliases of at
most 64 characters, without `tpl-` / `snap-` prefixes, namespace or tag; this
prevents CubeAPI from silently discarding name parts. Unknown fields, non-image
sources and URL image references (including plain HTTP registries) are rejected.

The adapter submits `POST /templates`, validates `templateID` / `jobID`, then polls
that exact job through `GET /templates/{templateID}/builds/{jobID}/status`. Only
public `status: "ready"` completes. The linked CubeMaster status handler maps
internal `PENDING` / `RUNNING` / `BUILT` to `building`, and `FAILED` to `error`;
internal `BUILT` still needs distribution/registration. It uses only the
provider's resolved origin and optional key, sends private registry credentials
only in the submission body, disables redirects and submission retries, and
discards raw backend error bodies. Timeout/cancellation bounds waiting; a submitted
remote build may remain, and templates are never automatically deleted.

The pinned official models/handlers/services linked above define the reviewed
contract. Run `node tests/run.mjs` in `cubesandbox/`: on 2026-10-18 all ten T0 checks
passed, including actual loopback HTTP submission/polling and credential redirect
prevention. These are source-derived contract fixtures, not the official CubeAPI
server or a KVM cluster. Optional `tests/installed-host.mjs` passed install/consent/
dispatch with an unreleased local built host and an isolated HOME, opting in only
in a temporary plugin copy. Re-run with `ABX_CLI_ENTRY=<absolute reviewed CLI entry>
node tests/installed-host.mjs`. Compatible host/schema delivery and live template
build/create/exec/kill remain gates before capability enablement; no released host
compatibility is claimed.

## 自动准备项目（Beta） / Automatic project preparation (Beta)

使用包含 `template launch` 和 `kit.project` 的 CLI 源码版，安装或更新本插件后运行：

```sh
abx --provider cubesandbox template launch alibaba-agent-sandbox/awesome-templates//python-hello --yes
```

提供方现在声明 `templates.build`，用于 node/1 管理器的 `prepareProject`。旧模板管理/API 方法和独立的 `templates.deploy` 不会因此自动启用。CLI 自动把适配器返回的 ID、名称或镜像传给创建，启动服务并验证就绪；缺少模板声明的运行时能力时，在构建前拒绝。正常沙箱行为不变。

Use a CLI source build containing `template launch` and `kit.project`. The node/1 `prepareProject` manager is guarded by `templates.build`; legacy template management APIs and the standalone `templates.deploy` factory are not implied. The exact returned native reference is handed to sandbox creation. Missing runtime capabilities fail before build. Normal sandbox operations remain unchanged.

先配置 Docker 登录、可写 `ABX_CUBESANDBOX_IMAGE_REPOSITORY` 及原生运行时 `ABX_CUBESANDBOX_BUILD_BASE_IMAGE`。镜像需包含 Cube 启动、envd/Jupyter 等要求。API、私有镜像拉取认证分别使用此插件自己的字段。适配器构建/推送不可变镜像，用原生 CubeAPI 登记并轮询，再返回 ID；PTY 仍未声明。

Configure Docker login, a writable `ABX_CUBESANDBOX_IMAGE_REPOSITORY` and a compatible native `ABX_CUBESANDBOX_BUILD_BASE_IMAGE`, including Cube startup/envd/Jupyter requirements. API and private image pull credentials remain provider-scoped. The adapter builds/pushes an immutable image, registers it through native CubeAPI and waits for its exact job. PTY remains undeclared.

所有新路径保持 Beta；原生 E2B、Cube、集群验收仍按维护者要求暂缓。单元/回环/实际 SDK 测试不能当成云验收。临时目录会清理；成功沙箱、镜像和已登记模板不会自动删除，可能继续计费。准备超时可能遗留已提交产物，启动/就绪失败会尝试删除本次新建沙箱并报告清理状态。源码安装、引用契约及完整限制见[指南](https://github.com/Alibaba-Agent-Sandbox/agent-sandbox/blob/main/docs/zh/guide/template-launch.md)。

All new paths remain Beta. Native E2B/Cube/cluster acceptance is explicitly deferred by the maintainer; unit/loopback/official SDK protocol tests are not cloud acceptance. Temporary staging is cleaned. Successful sandboxes, images and registered templates are retained and may incur cost. Preparation timeout may leave submitted artifacts; startup/readiness failure attempts cleanup of this invocation's new sandbox. See the [host guide](https://github.com/Alibaba-Agent-Sandbox/agent-sandbox/blob/main/docs/en/guide/template-launch.md) for installation, reference contracts and limits.
