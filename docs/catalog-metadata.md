# Provider-owned catalog examples

[中文](catalog-metadata.zh-CN.md)

Each provider directory may include `catalog.json` for registry display:

```json
{
  "schema_version": 2,
  "maturity": "beta",
  "template_input": "template-id",
  "template_example": "<existing template ID>"
}
```

`template_input` is `template-id` or `image-uri`; `template_example` is a nonempty
string of at most 512 characters. Version 1 allows exactly the original three fields and
limits the file to 16 KiB. With no metadata, consumers show an explicit placeholder.
This is display data, not executable instructions, an install source, an endpoint,
a command factory or evidence of a native cloud test. The registry must never
import provider code or infer examples by switching on a vendor ID.

A provider may resolve its documented aliases (such as `base`) to an image; the
registry does not invent or resolve those aliases.

Actual callable capabilities come from `abx-provider.toml`, and the runtime owns
image aliases, units, authentication and unsupported calls. A template author can
state prerequisites in the template index; those hints do not override a missing
provider capability and are not a verified-on badge. The independent image factory
remains opt-in: adding metadata must not declare `templates.deploy` or enable an
unverified adapter. In particular E2B/Cube image adapter draft work retains its
separate host and native acceptance gates.

The metadata is part of the provider tree and reproducible package digest. This
change bumps each affected patch version in the manifest and index; it changes
examples, not backend behavior. A Git update follows its recorded source/ref; a
pinned install stays pinned. The Python catalog updater uses the catalog version
and digest. Local/link installs use the reviewed local source. No catalog display
change silently upgrades a user's installed provider.

The built-in Express provider is owned and released with its host, outside this
plugin catalog. `provider update alicloud-express --check` in the coordinating host
change reports the bundled lifecycle and upgrade instructions, not a separate
plugin or an automatic host installation. See the
[host design](https://github.com/Alibaba-Agent-Sandbox/agent-sandbox/blob/c5a6a3c75921cfb4359f1c23041ec847ce63c932/docs/en/design/provider-portability-and-updates.md).

## Acceptance status

Version 2 requires exactly four fields: `schema_version`, `maturity`, `template_input`, and `template_example`. `maturity` is `stable` or `beta`. Consumers continue accepting strict three-field version 1 metadata and treat it, or absent metadata, as Beta. `official` and `builtin` do not establish acceptance. The provider owns its stage; the registry reads it without vendor-ID switches.

All four catalog providers remain Beta, with formal acceptance deferred; only the accepted bundled Express provider is Stable. Promotion requires native-backend CLI/SDK and declared-capability acceptance, cleanup evidence, documentation/limitations review, and maintainer approval. T0 or server health alone is insufficient.

## Project preparation metadata (version 3)

Version 3 adds exactly `project_preparation` to version 2. Its value is `sdk-build`, `image-build`, `image-reference` or `cluster-template`. The provider owns this display hint; consumers additionally require `templates.build`, sandbox lifecycle and every template-required runtime capability. Metadata alone enables nothing. It is data, never an executable command or native acceptance receipt. All catalog providers retain `maturity: beta`. Older version 1/2 metadata remains accepted and has no project preparation hint.

版本 3 仅在版本 2 上增加 `project_preparation`，取值为 `sdk-build`、`image-build`、`image-reference`、`cluster-template`。提供方拥有此展示提示；消费者还须检查 `templates.build`、沙箱生命周期和模板要求的每项运行时能力。元数据不执行代码，不单独启用能力，也不是原生验收证据。目录提供方继续为 Beta，旧版本 1/2 仍兼容且无此提示。
