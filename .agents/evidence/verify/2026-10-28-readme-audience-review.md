# Verification: awesome-providers README audience review

- Date: 2026-10-28
- Result: PASS — scoped local documentation verification. Remote checks and merge are reported separately on the PR.
- Base revision: `188b04ce98c6b71da0ba4145845fbd925051b03a`.
- Scope: `README.md`, `README.zh-CN.md`; repository-owned note and this evidence.
- Environment: Linux, Node.js 22.22.2, system Python 3.13.13; SDK/server and checker environment Python 3.11.15.

## What was reviewed

The README mixed languages, repeated four installation commands and discussed EPP/Node implementation, pending factories and retired compatibility paths. Backend selection and actual setup prerequisites were difficult to scan.

Provide separate English and Chinese READMEs with a backend/setup table, one interactive install path, automation pinning guidance and the explicit Python extension boundary. Keep Beta and supported deployment scope visible. Link existing authoring, operations and installation references; provider code and metadata remain unchanged.

## Validation

`python "$README_AUDIT"` passed for 5 changed Markdown files, with zero failures. This temporary audit used the existing template repository's Markdown-target/heading parser at its checked-out base revision and a task wrapper (SHA-256 `fe8c34fd4ef2474ca7dfcfcc94d2a055e9ead01a92fe2695446cfe08341df7e6`). It checks changed local targets/fragments, incoming active README heading links, one H1 and reciprocal language links in each root README, balanced fences and Python snippet syntax. `README_AUDIT` denotes that temporary wrapper; no machine-local path is part of the repository. It does not validate cloud runtime behavior.

`git -c core.filemode=false diff --check HEAD` passed. The filesystem exposes executable bits on unchanged checkout files; ignoring those bits for task-local Git commands avoided including unrelated mode changes. The staged change was reviewed for prose-only scope, translation equivalence, current command/API names and preserved license links. Package registry checks on 2026-10-28 found CLI 0.5.8 and Python client 0.4.0a6; the Node SDK public npm metadata endpoint returned HTTP 404. No new package publication is claimed.

## Limits and cleanup

Documentation changes only. No provider API calls, sandboxes, templates, cloud keys, model calls, deployments or package releases were created by local verification. Existing historical receipts remain unchanged. CI and existing main-branch publication workflows retain their own scope.

## Repository checks

- `node tests/run.mjs (in opensandbox/)`: PASS: 63 tests, 0 failures; local/mock provider behavior only.

## Reviewed public-file identity

| File | SHA-256 |
| --- | --- |
| `README.md` | `9d9fc4e26b8b94905e1f4168709b67586f187e274a3f75bc5697d475a3b982c0` |
| `README.zh-CN.md` | `85f8d9bf004df7daf86ddf83512b4e0aeeea52c52588caa67314931cb4e0c67c` |
