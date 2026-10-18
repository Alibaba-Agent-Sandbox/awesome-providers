# OpenSandbox documentation contract verification

Result: PASS

Date: 2026-10-18. Base: `f629111`. Scoped file:
`opensandbox/docs/README.md` and its engineering records.

Checks actually run:

- Parse `opensandbox/abx-provider.toml` with Python `tomllib` and compare documented
  native aliases and the empty core inheritance set: PASS.
- Review manifest and `provider.mjs` FEATURES against the README: `sessions` is
  declared; `src/exec.mjs` implements `exec.start` with `detached: true`, and the
  existing mock test follows its output through the log cursor. Both primary
  language READMEs already describe the host limitation: PASS.
- Resolve all local Markdown links added or retained in the scoped files: PASS.
- `git diff --check`: exit 0. Staged configured-secret scan: PASS.

No runtime file changes. T0 was run and passed 51/51 on the base change delivered
by [PR #7](https://github.com/Alibaba-Agent-Sandbox/awesome-providers/pull/7);
this does not claim a new runtime or real-backend run for the documentation change.
T1/T3/T4 were not run because only prose changes. No cloud resources were created.
The normal remote CI remains a separate delivery check.

Issue: https://github.com/Alibaba-Agent-Sandbox/awesome-providers/issues/3.
