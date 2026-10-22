# Provider catalog metadata / 提供方目录元数据

`catalog.json` uses only schema version 3, with exactly these fields:
`schema_version`, `maturity`, `template_input`, `template_example`, `project_preparation`.

```json
{"schema_version":3,"maturity":"beta","template_input":"template-id","template_example":"base","project_preparation":"sdk-build"}
```

`maturity` is `stable` or `beta`; catalog plugins remain Beta until native acceptance.
`template_input` is `template-id` or `image-uri`; examples are nonempty strings up to 512 characters.
`project_preparation` is `sdk-build`, `image-build`, `image-reference` or `cluster-template`.
The file is limited to 16 KiB. Metadata is display data; runtime calls require the manifest's
`templates.build` feature and `buildTemplateManager(ctx).prepareProject` implementation.
Provider code owns credentials, native API mapping and readiness. Registry never executes metadata.
A missing file shows a placeholder. Any present file must match the current schema.

仅接受版本 3 及上述五个字段。目录提供方在完成原生验收前仍为 Beta；目录元数据用于展示，
运行时项目构建由提供方声明的 `templates.build` 和项目管理器负责。元数据本身不启用能力，
不代表云端验收通过。文件缺失时显示占位提示，已有文件必须符合当前格式。
