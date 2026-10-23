# OpenSandbox source application rerun after YAML profile correction

Result: PARTIAL; new real T4 execution required.

Observed source: https://github.com/Alibaba-Agent-Sandbox/awesome-providers/actions/runs/39939154965 on f84828f934f2f16a97cc69bd6f8f848413d541ef. All setup, actual SDK parser, isolated-home harness, real Docker backend, direct plugin/installed contract/environment, Python SDK scenarios and CLI lifecycle/files steps passed. The final native project application step failed before image build because the quoted root profile was required by the CLI YAML 1.1 scalar semantics. The final cleanup step passed and verified zero remaining sandbox containers. GitHub reported zero uploaded artifacts for this run; conclusions here come from the actual jobs API and downloaded step logs.

The old template source used bare `context: .`, which the real CLI loader resolves to NaN. https://github.com/Alibaba-Agent-Sandbox/awesome-templates/commit/bf410ec1b82febe0f668327d119683ebfdf69f9c explicitly quotes the root context. This workflow now pins that exact corrected source. CLI 128f8dc6c71a9be9e28a9608e1e19f1b2e44a374 and Python SDK 2c7c4dd554d0623143b7e6277faf0019ca3138ee runtime pins remain unchanged.

Local checks: actual CLI loader strict equality on the corrected complete source manifest PASS; template workflow/managed tests 37 PASS and python-hello full manifest checker PASS, recorded by the template owner. Workflow YAML parsed successfully and `git diff --check` PASS. No local Docker daemon exists; no complete source workflow acceptance is claimed until the rerun passes.
