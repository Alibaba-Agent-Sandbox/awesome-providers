# 端到端测试方案

[English](e2e.md)

本目录里的每个 provider 都用同一套分级。跑不了的层级记为 skip 并写明原因，不算通过。

| 层级 | 证明什么 | 命令 | 需要 |
|---|---|---|---|
| T0 | 这个 provider 自己的单元测试和 mock 测试 | 在 provider 目录里执行 `node tests/run.mjs` | Node >= 20 |
| T1 | 安装、同意、固定版本、篡改检测、doctor、卸载。不创建沙箱 | `cli/e2e/providers/run.sh offline` 和 `python-sdk/e2e/opensandbox/provider_install_e2e.py` | git、Node、SDK |
| T2 | 用 `abx` 完成创建、执行、文件和销毁。这个 provider 不需要云 | `cli/e2e/providers/run.sh local-process` | Python 3 |
| T3 | 用户实际输入的安装命令：`abx provider install alibaba-agent-sandbox/awesome-providers//<name>` | `cli/e2e/providers/run.sh catalog` | git 和 GitHub |
| T4 | 插件真正调用的后端。对 OpenSandbox 来说是本机服务 | `local-up.sh up`，然后 `run.sh opensandbox` 和 `provider_e2e.py` | OpenSandbox 需要 Docker |
| T5 | 内置阿里云 provider。不是本目录的测试 | CLI 仓库里 `npm run e2e`，SDK 仓库里 `make e2e` | 云凭证 |

## 规则

- 使用一次性的 `HOME`。不要碰开发者真实的 `~/.abx`。
- 不要打印 API key。`provider config list` 的输出里不能有密钥。
- 插件没有声明的能力必须以 `E8004` 失败。
- 不要用 `abx create "一句话"` 做 provider 测试。使用 `abx --provider <id> create --template <镜像或名称>`。
- 只销毁这次运行创建的沙箱。

## Pull request 要带上什么

T0 通过。README 写明能用、部分可用、以及返回 E8004 的能力。T1 安装这个新目录。只有当你能在这个 pull request 里把后端拉起来时，才要求 T4。

CLI 和 SDK 仓库里的同一张表在 `cli/e2e/providers/PLAN.md`。

## OpenSandbox 真实后端自动验证

`OpenSandbox live integration` 在一次性 Ubuntu Docker runner 上执行 T4，使用固定的 CLI/SDK 提交、server 1.1.1 和摘要固定的 execd 镜像，覆盖 EPP、安装后的 SDK 契约、配置优先级及 CLI 往返，并清理该隔离 runner 上所有测试容器。不使用云凭证。局部 Docker 结果不会把 OpenSandbox 从 Beta 自动升级，也不证明 Kubernetes、网络策略或代码解释器已通过。
