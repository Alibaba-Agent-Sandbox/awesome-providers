# 提供方目录元数据

`catalog.json` 仅接受 schema 版本 3，字段必须恰好为：
`schema_version`、`maturity`、`template_input`、`template_example`、`project_preparation`。

```json
{"schema_version":3,"maturity":"beta","template_input":"template-id","template_example":"base","project_preparation":"sdk-build"}
```

`maturity` 为 `stable` 或 `beta`；目录插件完成原生验收前保持 Beta。
`template_input` 为 `template-id` 或 `image-uri`，示例为最多 512 字符的非空字符串。
`project_preparation` 为 `sdk-build`、`image-build`、`image-reference` 或 `cluster-template`。
文件大小上限为 16 KiB。

元数据仅用于展示。运行时需要清单声明 `templates.build`，并实现
`buildTemplateManager(ctx).prepareProject`。凭据、原生 API 映射和就绪检查由提供方负责，
Registry 不执行元数据。文件缺失时显示占位提示，已有文件必须符合当前格式。
能力声明和目录元数据均不代表云端验收通过。
