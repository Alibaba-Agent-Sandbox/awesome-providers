# Preserve the primary live workflow failure

Result: PARTIAL; live rerun required.

Actual failed run: https://github.com/Alibaba-Agent-Sandbox/awesome-providers/actions/runs/39939908209, provider d60876e69ab848116a21b3d74780a818bc871650. All steps through real Docker setup, plugin/installed contracts, Python SDK scenarios and CLI lifecycle/files passed. The application step acquired an owned sandbox ID, then failed. The final cleanup code successfully issued kill but its `JSON.parse` of an empty CLI `--json list` result replaced the earlier error with `Unexpected end of JSON input`. The run's outer Docker cleanup verified no remaining sandbox containers. No artifacts were uploaded by this workflow.

The CLI owner corrected empty single/all-provider `--json list` to output `[]`, validated 41 CLI regressions plus typecheck/lint/build, and committed https://github.com/Alibaba-Agent-Sandbox/agent-sandbox/commit/0ae68e8b6e2721d04f715d73618899004097264a. T4 now pins this exact runtime. The test continues to require valid JSON and does not accept the old empty string.

The application fixture now preserves its primary error when a secondary owned-cleanup assertion fails, still propagates cleanup errors when the application succeeded, and prints only fixed phase markers after source/startup and CLI application checks. It performs cleanup in either path. Local `node --check opensandbox/tests/project-launch.mjs`, workflow YAML parsing, and `git diff --check`: PASS. No local native run was possible without Docker; no complete application acceptance is claimed. A new remote run must expose and resolve any primary application error and confirm final cleanup.
