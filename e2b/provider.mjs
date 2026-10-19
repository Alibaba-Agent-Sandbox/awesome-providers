// E2B cloud sandboxes. A `node/1` plugin: the host passes the kit, this file only builds the protocol objects.
import { createTemplates } from "./templates.mjs";

export default function create(kit) {
  return {
    // Host extension; keep templates.deploy undeclared until native backend acceptance is recorded.
    async buildTemplates(ctx) {
      if (!ctx.features?.has("templates.deploy")) throw new kit.errors.ProviderFeatureNotSupportedError("e2b", "templates.deploy");
      const Template = kit.e2b.loadTemplate ? await kit.e2b.loadTemplate() : kit.e2b.Template;
      return createTemplates({ Template, options: ctx.options, errors: kit.errors });
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
      return {
        auth,
        http_client: http,
        endpoint: { base_url, domain },
        sandbox_protocol: kit.e2b.resumeConnect(new kit.SandboxProtocol(http, { unknownIfAbsent: true }), [
          "/v2/sandboxes/{id}/connect",
          "/sandboxes/{id}/connect",
        ]),
        process_protocol: new kit.ProcessProtocol(http),
        filesystem_protocol: new kit.FilesystemProtocol(http),
        code_interpreter_protocol: new kit.CodeInterpreterProtocol(http),
      };
    },
  };
}
