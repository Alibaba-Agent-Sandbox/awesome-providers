import { projectManager } from "./project.mjs";
// Tencent CubeSandbox (CubeAPI). A `node/1` plugin.
const ENVD_PORT = 49983;
const JUPYTER_PORT = 49999;

function parseProxy(value) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const [host, port] = text.split(":");
  if (!host) return null;
  return [host, port ? Number(port) : 80];
}

/** `http://49983-{id}.{domain}` -> `http://49999-{id}.{domain}`. */
function jupyterOrigin(envdUrl) {
  const u = new URL(envdUrl);
  if (u.hostname.startsWith(`${ENVD_PORT}-`)) u.hostname = `${JUPYTER_PORT}-${u.hostname.slice(`${ENVD_PORT}-`.length)}`;
  return `${u.protocol}//${u.host}`;
}

export default function create(kit) {
  class RootFiles extends kit.FilesystemProtocol {
    async read(envdUrl, token, opts) {
      return this.downloadFile(envdUrl, token, { path: opts.path, username: "root" });
    }
    async write(envdUrl, token, opts) {
      const bytes = typeof opts.content === "string" ? new TextEncoder().encode(opts.content) : opts.content;
      await this.uploadFile(envdUrl, token, { path: opts.path, content: bytes, username: "root" });
    }
  }

  return {
    async buildTemplateManager(ctx) {
      if (!ctx.features?.has("templates.build")) throw new kit.errors.ProviderFeatureNotSupportedError(ctx.id, "templates.build");
      return projectManager(kit, ctx);
    },
    async buildInfra(ctx) {
      const key = String(ctx.options.api_key ?? "");
      const base_url = String(ctx.options.base_url || "http://127.0.0.1:3000").replace(/\/+$/, "");
      const domain = String(ctx.options.domain || "cube.app");
      const auth = key ? ctx.headerKeyAuth(key, "X-API-Key") : ctx.noAuth();
      const http = ctx.http({ base_url, domain, auth, envelope_connect: true, envd_dial: parseProxy(ctx.options.proxy) });

      const inner = kit.e2b.resumeConnect(new kit.SandboxProtocol(http, { unknownIfAbsent: true }));
      const domains = new Map();
      const tokens = new Map();
      const fill = (info) => {
        if (info.sandbox_id && !info.envd_url) {
          info.envd_url = `http://${ENVD_PORT}-${info.sandbox_id}.${info.reported_domain || domain}`;
        }
        if (info.sandbox_id) {
          domains.set(info.sandbox_id, info.reported_domain || domain);
          if (info.envd_access_token) tokens.set(info.sandbox_id, info.envd_access_token);
        }
        return info;
      };
      const sandbox = kit.e2b.overlay(inner, {
        create: async (config, opts) => fill(await inner.create(config, opts)),
        connect: async (id) => fill(await inner.connect(id)),
        getInfo: async (id) => fill(await inner.getInfo(id)),
        list: async (opts) => (await inner.list(opts ?? {})).map(fill),
        resume: async (id) => {
          await http.platformRequest("POST", `/sandboxes/${id}/resume`, { json: {} });
        },
        // CubeProxy routes on the hostname prefix and speaks HTTP on port 80. The create response's domain wins.
        hasPortUrl: true,
        portUrl: async (id, port) => {
          const headers = {};
          const token = tokens.get(id);
          if (token) headers["X-Access-Token"] = token;
          return [`http://${port}-${id}.${domains.get(id) || domain}`, headers];
        },
      });

      const code = {
        async runCode(_id, envdUrl, token, opts) {
          const body = { code: opts.code ?? "", language: opts.language || "python" };
          if (opts.envs && Object.keys(opts.envs).length) body.env_vars = opts.envs;
          const response = await http.envdHttpRequest(jupyterOrigin(envdUrl), "POST", "/execute", {
            envd_token: token,
            headers: { "Content-Type": "application/json", "E2b-Sandbox-Port": String(JUPYTER_PORT) },
            content: JSON.stringify(body),
          });
          return kit.e2b.parseExecution(response.text);
        },
      };

      return {
        auth,
        http_client: http,
        endpoint: { base_url, domain },
        envd_auth: { allow_missing: true, basic_user: "root" },
        sandbox_protocol: sandbox,
        process_protocol: kit.e2b.withDefault(new kit.ProcessProtocol(http), "user", "root", ["start"]),
        filesystem_protocol: new RootFiles(http),
        code_interpreter_protocol: code,
      };
    },
  };
}
