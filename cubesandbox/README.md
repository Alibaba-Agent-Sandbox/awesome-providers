# CubeSandbox

目录提供方，id 是 `cubesandbox`。安装之后由 Python SDK 加载。CLI 不加载 `kind = "python"`。

总说明：[工作原理](../docs/zh/principle.md) · [安装](../docs/zh/install.md) · [审查里还没跑到的项](../docs/zh/catalog.md)

## 安装和调用

```bash
python -m agent_sandbox.providers install registry:cubesandbox --yes
```

```python
from agent_sandbox import Sandbox

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

`pty`、`process.manage`、`files.transfer`、`templates.read`、`templates.build`、`ports.domain`、`storage.mount`、`network.vpc`、`sessions`。

OpenAPI 里还有卷、网络策略、分发范围。它们登记成扩展，`implemented=False`，适配器不调用。`GET /sandboxes` 忽略 `status` 和 `offset`，按状态过滤要等改打 `GET /v2/sandboxes`。

## 实测

单元测试打的是本机假 API，锁住的是上面这些路径和帧。这台环境没有 Cube 集群（端口 3000 没有 CubeAPI），所以 `e2e/test_08_providers.py` 里的真实创建没有执行。拿到集群之后按 [目录与审查](../docs/zh/catalog.md) 里 Cube 那几行再跑一遍。

## English

Catalog provider, id `cubesandbox`. The Python SDK loads it after install. The CLI does not load `kind = "python"`.

```bash
python -m agent_sandbox.providers install registry:cubesandbox --yes
```

| Field | Environment | Default |
|---|---|---|
| CubeAPI origin, no path | `ABX_CUBESANDBOX_BASE_URL` | `http://127.0.0.1:3000` |
| Optional `X-API-Key` | `ABX_CUBESANDBOX_API_KEY` | omitted when unset |
| Data-plane domain | `ABX_CUBESANDBOX_DOMAIN` | `cube.app` |
| CubeProxy `host:port` | `ABX_CUBESANDBOX_PROXY` | unset |

The data plane is `http://49983-{id}.{domain}`. The `49983` prefix is how CubeProxy routes; HTTP is port 80. It does not read `ABX_SANDBOX_API_KEY`. Process and file calls default the user to `root` and use a 5-byte Connect envelope. `run_code` is Jupyter `POST /execute` on port 49999, read as ndjson. `resume` sends `{}`.

`E8004`: `pty`, `process.manage`, `files.transfer`, template features, `ports.domain`, `storage.mount`, `network.vpc`, `sessions`. Volume, network policy, and distribution scope are extensions with `implemented=False`.

Unit tests hit a local fake API. This environment has no Cube cluster, so the live create in `e2e/test_08_providers.py` did not run. Use a real template id from the cluster; do not assume `base` exists.
