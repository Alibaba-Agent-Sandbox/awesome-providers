# 开发一个提供方

开发时用链接安装，改文件不用重装。链接安装不校验目录树摘要，只用于本机。

```bash
python -m agent_sandbox.providers install ./my-cloud --link --yes
python -m agent_sandbox.providers doctor my-cloud
python -m agent_sandbox.providers test my-cloud
```

`--link` 必须带 `--yes`。没有 `--yes` 是 `ProviderTrustError`（E8012）。

CLI 对 `exec` 和 `rest` 有同样的命令：`abx provider install ./my-cloud --link --yes`，然后 `abx provider doctor` 和 `abx provider test`。`python` 提供方用上面的 Python 模块。CLI 读到 `kind = "python"` 会拒绝这份清单。

## 开发时看什么

1. `doctor` 查清单、`requires`、配置是否齐、握手是否成功。
2. `test` 跑契约套件。没声明的能力跳过，不算失败。声明了却没实现，会失败。套件覆盖生命周期、执行、流式输出、文件、进程、超时和错误码映射。
3. 用本机假的 TCP 服务看请求路径和认证头，确认 `ABX_SANDBOX_API_KEY` 没有被发出去。
4. 有真实后端时，最少做一次创建、一条命令、一次文件往返、一次销毁。没有后端就跳过，并写明缺哪个变量。不要拿另一家的密钥去试。

契约套件需要 pytest。`python -m agent_sandbox.providers test my-cloud` 和 `abx provider test my-cloud` 是同一套。

## 改清单之后

链接安装直接读源目录。普通安装会把文件复制到 `~/.abx/providers/<id>`，并在 `.abx-install.json` 里记下 SHA-256 目录树摘要。除 `data/` 以外的文件都进摘要。启动时再核一次，对不上是 `ProviderIntegrityError`（E8011）。

所以开发用 `--link`。准备交给别人时再做一次不带 `--link` 的安装，确认摘要和同意界面。

`provider update` 从安装时记下的来源重新取。命令、安全块或能力列表变了，要重新同意。钉死在 40 位 commit 或 `--sha256` 上的安装不会自己挪；要换版本就再给 `--ref`。新版本握手失败时，上一版连同 `data/` 会原样放回去。

## 能力要对着后端写

对照该后端当前的 OpenAPI 或官方 SDK，不要对照本仓库里旧的单元测试假服务器。假服务器只证明适配器发出了你让它发的请求。

写完之后在这个提供方自己的 `docs/` 里记三件事：

- 声明了哪些能力，各自打到哪条路径
- 哪些调用会 `E8004`
- 哪几条在真实环境里跑过，哪几条只对照过文档

本目录里四个官方提供方的记录在各自的 `docs/README.md`。还没有真实后端的差异，集中在 [目录与审查](catalog.md)。

## 给代理的技能

让代理写提供方时，用仓库里的 `python-sdk/agent-sandbox-provider/SKILL.md`，或本目录的 [SKILL.md](../../SKILL.md)。那两份说的是同一件事：选 kind、列能力、不碰极速版密钥、没有后端就不要假装跑过。
