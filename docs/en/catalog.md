# Providers in this catalog

The index is `index.json` at the catalog root. The public URL is `https://registry.agent-sandbox.cn/providers/index.json`.

The registry website is <https://registry.agent-sandbox.com>. The official site is <https://www.agent-sandbox.com>. The installer still fetches the index URL above.

| Id | Docs | Backend | Verdict on 2026-10-14 |
|---|---|---|---|
| `opensandbox` | [docs](../../opensandbox/docs/README.md) | Local OpenSandbox, default `http://127.0.0.1:8080` | Create, commands, files, ports, pause, and the terminal ran against a local OpenSandbox |
| `cubesandbox` | [docs](../../cubesandbox/docs/README.md) | CubeAPI, default `http://127.0.0.1:3000` | Paths match the current Cube SDK and OpenAPI. This environment has no Cube cluster, so live create did not run |
| `e2b` | [docs](../../e2b/docs/README.md) | `https://api.e2b.app` | The HTTP shape matches the current E2B API. There is no `ABX_E2B_API_KEY`, so live create did not run |
| `alicloud-container` | [docs](../../alicloud-container/docs/README.md) | ACS/ACK sandbox-manager | Native and private URL shapes are wired. There is no cluster domain or key, so live create did not run |

Install any of them with `abx provider install registry:<id> --yes` (or `python -m agent_sandbox.providers install registry:<id> --yes`). None of them reads the Express key `ABX_SANDBOX_API_KEY`.

## Behavior changed after the review

These were changed to match the current official SDK or OpenAPI. Unit tests lock the new behavior. The three without a backend here can send the request; the response has not been seen on the target.

| Problem | Now |
|---|---|
| E2B's default domain was `e2b.dev` | Default is `https://api.e2b.app` and `e2b.app`. Point an old account back with the environment variables |
| Cube's default domain was `localhost` | Default is `cube.app`. The data plane is `http://49983-{id}.{domain}`, not port 443 |
| `connect` sent only GET | E2B, Cube, and the container edition POST `/sandboxes/{id}/connect` first (E2B also tries `/v2/.../connect`), then GET on 4xx |
| Cube process and file calls omitted the user | Default `user` / `username` is `root`, with `Authorization: Basic` |
| Cube create responses have no `envdAccessToken` | No `X-Access-Token`, and no `TokenExpiredError` before the request |
| Cube `resume` had an empty body | `POST /resume` sends `{}` |
| Cube and container `run_code` called envd CodeInterpreter | They POST Jupyter `/execute` on port 49999 and read ndjson |
| Cube envd treated the first 5 bytes of raw JSON as a frame header | Cube envd requests add a 5-byte Connect envelope and `Connect-Protocol-Version: 1` |
| Process Start omitted `stdin` | The shared process protocol sends `stdin: false`, so `cat` does not wait until the HTTP timeout |
| `state: pausing` | `SandboxStatus` accepts `pausing` |

## Still needs a real backend

| Provider | Call | What to confirm |
|---|---|---|
| Cube | `run_code` twice, the second read reading a variable from the first | Whether Jupyter keeps state outside that single `/execute` |
| Cube | Client is not on the node | `ABX_CUBESANDBOX_PROXY=host:80`. TCP goes to the proxy; Host stays the virtual name |
| Cube | `Sandbox.list(status=...)` | `GET /sandboxes` ignores `status` and `offset`. Filtering waits on `GET /v2/sandboxes` |
| E2B | `Sandbox.connect` to a paused sandbox | Should hit `POST /connect` and resume. `resume()` after `pause()` still uses `POST /resume`, which OpenAPI marks deprecated |
| E2B, container | `get_terminal` | Undeclared, so `E8004`. Public envd uses the `pty` field on process Start, not WebSocket `/terminal` |
| Container native | Create response has no `envdUrl` | The adapter fills `https://49983-{id}.{domain}`. If the cluster's envd port is not 49983, commands dial the wrong host |
| Container private | Create | Data plane is `https://{domain}/kruise/{id}/49983`. A port URL is `https://{domain}/kruise/{id}/{port}` |

Offline tests: `cli/tests/test_providers/test_node_plugins.test.ts` (the three `node` plugins against an E2B-shaped mock, including the Connect envelope, the proxy dial, the optional token and the terminal), `cli/tests/test_engine/test_engine.test.ts` (the engine), `opensandbox/tests` (the OpenSandbox plugin) and `python-sdk/client-sdk/tests/test_providers/test_engine_provider.py` (Python SDK to engine to plugin to mock). A live OpenSandbox server, when one answers on `127.0.0.1:8080`, is also exercised from the CLI tests and from Python. A missing key or backend skips that provider. It does not send another provider's key.
