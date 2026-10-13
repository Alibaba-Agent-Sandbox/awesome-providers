# Security

Do not open a public issue for a vulnerability that exposes credentials, sandbox breakout, or installer trust bypass. Email the maintainers through the security contact of the [Easy Sandbox](https://github.com/Easy-Sandbox/python-sdk) organization, and include a reproduction that uses a throwaway key.

What to report:

- A plugin install that executes code before the user consents.
- A path in a provider source that escapes the install directory (`..`, symlinks, submodules).
- Secrets from `initialize.config` written to logs, receipts, or `provider info` output.
- An `E8004` feature that is still reachable.

What not to send: live API keys, access keys, or a copy of `~/.ebx/.env`.

## 中文

会泄露凭证、逃出沙箱，或绕过安装信任检查的问题，不要开公开 issue。通过 [Easy Sandbox](https://github.com/Easy-Sandbox/python-sdk) 组织的安全联系方式邮件告知维护者，并附上使用一次性密钥的复现步骤。

需要报告的情况：安装插件时在用户同意之前就执行了代码；provider 源码里的路径逃出安装目录（`..`、符号链接、子模块）；`initialize.config` 里的密钥被写进日志、安装回执或 `provider info` 的输出；声明为 `E8004` 的能力仍然可以被调用。

不要发送：真实的 API key、AccessKey，或 `~/.ebx/.env` 的副本。
