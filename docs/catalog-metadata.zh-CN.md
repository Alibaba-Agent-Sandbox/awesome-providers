# Provider 自己维护目录示例

[English](catalog-metadata.md)

各 provider 目录可包含供 Registry 展示的 `catalog.json`：

```json
{
  "schema_version": 2,
  "maturity": "beta",
  "template_input": "template-id",
  "template_example": "<existing template ID>"
}
```

`template_input` 只能是 `template-id` 或 `image-uri`；`template_example` 为不超过
512 字符的非空字符串。版本 1 只允许这三个字段，文件不超过 16 KiB。未提供元数据时，
消费者展示明确占位符。它不是可执行指令、安装来源、端点、命令工厂或真实云测试证据。
Registry 不导入 provider 代码，也不按供应商 ID 写死创建示例。

provider 可以把自己文档中的别名（例如 `base`）解析为镜像；Registry 不发明或解析这些别名。

实际能力来自 `abx-provider.toml`；镜像别名、单位、认证和不支持项由运行时适配器负责。
模板作者可以在模板索引记录使用前提，但不能覆盖 provider 缺失的能力，也不能用来
生成“已验证”徽标。独立镜像工厂仍需显式启用：添加本文件不声明 `templates.deploy`，
也不启用尚未验收的适配器。E2B/Cube 镜像适配器草稿的宿主及原生验收门禁仍然保留。

元数据属于 provider 文件树及可复现安装包摘要。本次同步增加清单和索引的补丁版本，
只改变示例，不改变后端行为。Git 更新遵循已记录的来源/ref；固定版本保持固定。
Python catalog 更新依据版本和摘要；本地/link 安装使用审阅的本地来源。
目录展示变化不会静默升级用户已安装的 provider。

内置极速版由宿主仓库维护并随宿主发布，不属于插件目录。协调宿主变更中的
`provider update alicloud-express --check` 报告内置生命周期及升级指引，不是一个独立
插件，也不自动安装宿主。见
[宿主设计](https://github.com/Alibaba-Agent-Sandbox/agent-sandbox/blob/c5a6a3c75921cfb4359f1c23041ec847ce63c932/docs/zh/design/provider-portability-and-updates.md)。

## 验收状态

版本 2 恰好包含 `schema_version`、`maturity`、`template_input`、`template_example` 四个字段。`maturity` 只能是 `stable` 或 `beta`。消费端继续兼容恰好三个字段的版本 1，并将它或缺失元数据的提供方视为 Beta。`official` 和 `builtin` 不表示正式验收。此状态由提供方维护，Registry 只读取，不根据厂商 ID 推断。

当前四个目录提供方都为 Beta，正式验收暂缓；只有已验收的内置极速版为正式版。推广为正式版需要该提供方的真实后端 CLI、SDK 和声明能力验收、清理证明、文档限制审查及维护者批准，不能只靠 T0 或健康检查。

## Project preparation metadata (version 3)

Version 3 adds exactly `project_preparation` to version 2. Its value is `sdk-build`, `image-build`, `image-reference` or `cluster-template`. The provider owns this display hint; consumers additionally require `templates.build`, sandbox lifecycle and every template-required runtime capability. Metadata alone enables nothing. It is data, never an executable command or native acceptance receipt. All catalog providers retain `maturity: beta`. Older version 1/2 metadata remains accepted and has no project preparation hint.

版本 3 仅在版本 2 上增加 `project_preparation`，取值为 `sdk-build`、`image-build`、`image-reference`、`cluster-template`。提供方拥有此展示提示；消费者还须检查 `templates.build`、沙箱生命周期和模板要求的每项运行时能力。元数据不执行代码，不单独启用能力，也不是原生验收证据。目录提供方继续为 Beta，旧版本 1/2 仍兼容且无此提示。
