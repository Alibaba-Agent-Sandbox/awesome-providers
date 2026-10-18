# Provider-owned catalog examples

[中文](catalog-metadata.zh-CN.md)

Each provider directory may include `catalog.json` for registry display:

```json
{
  "schema_version": 1,
  "template_input": "template-id",
  "template_example": "<existing template ID>"
}
```

`template_input` is `template-id` or `image-uri`; `template_example` is a nonempty
string of at most 512 characters. Version 1 allows exactly these three fields and
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
[host design](https://github.com/Alibaba-Agent-Sandbox/agent-sandbox/blob/main/docs/en/design/provider-portability-and-updates.md).
