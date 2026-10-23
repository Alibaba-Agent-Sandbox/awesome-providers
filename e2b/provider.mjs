import { OPERATION_CONTRACT_VERSION, OPERATIONS, WORKFLOW_INPUTS, STARTUP_MODES } from "./operations.mjs";
import { projectManager } from "./project.mjs";
// E2B cloud sandboxes. A `node/1` plugin: the host passes the kit, this file only builds the protocol objects.

export default function create(kit) {
  return {
    async buildTemplateManager(ctx) {
      if (!ctx.features?.has("templates.build")) throw new kit.errors.ProviderFeatureNotSupportedError(ctx.id, "templates.build");
      return projectManager(kit, ctx);
    },
    async buildInfra(ctx) {
      const key = String(ctx.options.api_key ?? "");
      if (!key) {
        throw new kit.errors.InvalidAPIKeyError("Provider 'e2b' has no API key.", { suggestion: "Set ABX_E2B_API_KEY." });
      }
      const base_url = String(ctx.options.base_url || "https://api.e2b.app").replace(/\/+$/, "");
      const domain = String(ctx.options.domain || "e2b.app");
      const auth = ctx.headerKeyAuth(key, "X-API-Key");
      const http = ctx.http({ base_url, domain, auth });
      const unsupportedCode = Object.fromEntries([
        ["runCode", "code.execute"], ["createContext", "code.context.create"],
        ["listContexts", "code.context.list"], ["restartContext", "code.context.restart"],
        ["removeContext", "code.context.delete"],
      ].map(([method, operation]) => [method, async () => {
        throw new kit.errors.ProviderFeatureNotSupportedError("e2b", operation);
      }]));
      return {
        operation_contract_version: OPERATION_CONTRACT_VERSION,
        operations: OPERATIONS,
        workflow_inputs: WORKFLOW_INPUTS,
        startup_modes: STARTUP_MODES,
        auth,
        http_client: http,
        endpoint: { base_url, domain },
        sandbox_protocol: kit.e2b.resumeConnect(new kit.SandboxProtocol(http, { unknownIfAbsent: true }), [
          "/v2/sandboxes/{id}/connect",
          "/sandboxes/{id}/connect",
        ]),
        process_protocol: new kit.ProcessProtocol(http),
        filesystem_protocol: new kit.FilesystemProtocol(http),
        code_interpreter_protocol: unsupportedCode,
      };
    },
  };
}
