import { projectManager } from "./project.mjs";
// Alibaba Cloud Agent Sandbox container edition (OpenKruise sandbox-manager, E2B-shaped). A `node/1` plugin.
const ENVD_PORT = 49983;
const CODE_PORT = 49999;

/** envd base -> origin and path of the Jupyter `/execute` on port 49999. */
function executeTarget(envdUrl) {
  const u = new URL(envdUrl);
  if (u.hostname.startsWith(`${ENVD_PORT}-`)) {
    u.hostname = `${CODE_PORT}-${u.hostname.slice(`${ENVD_PORT}-`.length)}`;
    return [`${u.protocol}//${u.host}`, "/execute"];
  }
  let p = u.pathname.replace(/\/+$/, "");
  p = p.endsWith(`/${ENVD_PORT}`) ? `${p.slice(0, -`/${ENVD_PORT}`.length)}/${CODE_PORT}/execute` : `${p}/execute`;
  return [`${u.protocol}//${u.host}`, p];
}

/** A host or host:port, with or without a scheme. A path, query or userinfo is a configuration error. */
function domainHost(raw, kit) {
  const text = String(raw ?? "").trim();
  if (!text) return "";
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(text)) {
    let u;
    try {
      u = new URL(text);
    } catch {
      throw new kit.errors.ProviderConfigError(`Provider 'alicloud-container' domain is not a valid host URL: '${text}'.`, {
        suggestion: "Set ABX_ALICLOUD_CONTAINER_DOMAIN to a host such as sbx.example.com.",
      });
    }
    if (u.username || u.password) {
      throw new kit.errors.ProviderConfigError("Provider 'alicloud-container' domain must not include credentials.", {
        suggestion: "Set ABX_ALICLOUD_CONTAINER_API_KEY separately.",
      });
    }
    if ((u.pathname && u.pathname !== "/") || u.search || u.hash) {
      throw new kit.errors.ProviderConfigError(`Provider 'alicloud-container' domain must be a host, got '${text}'.`, {
        suggestion: "Use sbx.example.com, or put the API origin in ABX_ALICLOUD_CONTAINER_BASE_URL.",
      });
    }
    if (!u.hostname) {
      throw new kit.errors.ProviderConfigError(`Provider 'alicloud-container' domain is not a valid host URL: '${text}'.`, {
        suggestion: "Set ABX_ALICLOUD_CONTAINER_DOMAIN to a host such as sbx.example.com.",
      });
    }
    return u.host;
  }
  if (/[\s/]/.test(text) || !/^[^:]+(:\d+)?$/.test(text)) {
    throw new kit.errors.ProviderConfigError(`Provider 'alicloud-container' domain must be a host, got '${text}'.`, {
      suggestion: "Set ABX_ALICLOUD_CONTAINER_DOMAIN to sbx.example.com (no scheme), or set ABX_ALICLOUD_CONTAINER_BASE_URL.",
    });
  }
  return text;
}

/** An http(s) origin. A value with no scheme is rejected instead of being requested as a relative URL. */
function apiBase(raw, kit) {
  const text = String(raw ?? "").trim().replace(/\/+$/, "");
  if (!text) return "";
  let u;
  try {
    u = new URL(text);
  } catch {
    throw new kit.errors.ProviderConfigError(`Provider 'alicloud-container' base URL needs an http or https scheme, got '${text}'.`, {
      suggestion: "Set ABX_ALICLOUD_CONTAINER_BASE_URL to https://api.example.com or http://127.0.0.1:port.",
    });
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new kit.errors.ProviderConfigError(`Provider 'alicloud-container' base URL must be http or https, got '${u.protocol.replace(/:$/, "")}'.`, {
      suggestion: "Set ABX_ALICLOUD_CONTAINER_BASE_URL to an http or https origin.",
    });
  }
  return text;
}

export default function create(kit) {
  return {
    async buildTemplateManager(ctx) {
      if (!ctx.features?.has("templates.build")) throw new kit.errors.ProviderFeatureNotSupportedError(ctx.id, "templates.build");
      return projectManager(kit, ctx);
    },
    async buildInfra(ctx) {
      const protocol = String(ctx.options.protocol || "native").toLowerCase();
      if (protocol !== "native" && protocol !== "private") {
        throw new kit.errors.ProviderConfigError(`Provider 'alicloud-container' protocol must be native or private, got '${protocol}'.`);
      }
      let domain = domainHost(ctx.options.domain, kit);
      let base = apiBase(ctx.options.base_url, kit);
      const key = String(ctx.options.api_key ?? "").trim();
      if (!domain && !base) {
        throw new kit.errors.ProviderConfigError("Provider 'alicloud-container' needs a domain or a base URL.", {
          suggestion: "Set ABX_ALICLOUD_CONTAINER_DOMAIN to the sandbox-manager domain.",
        });
      }
      if (!base) base = protocol === "private" ? `https://${domain}/kruise/api` : `https://api.${domain}`;
      if (!domain) {
        const name = new URL(base).hostname;
        domain = name.startsWith("api.") ? name.slice(4) : name;
      }
      if (!key) {
        throw new kit.errors.InvalidAPIKeyError("Provider 'alicloud-container' has no API key.", {
          suggestion: "Set ABX_ALICLOUD_CONTAINER_API_KEY.",
        });
      }

      const auth = ctx.headerKeyAuth(key, "X-API-Key");
      const http = ctx.http({ base_url: base, domain, auth });
      let origin = null;
      if (protocol === "private") origin = base.endsWith("/kruise/api") ? base.slice(0, -"/kruise/api".length) : `https://${domain}`;

      const inner = kit.e2b.resumeConnect(new kit.SandboxProtocol(http, { unknownIfAbsent: true }), [
        "/v2/sandboxes/{id}/connect",
        "/sandboxes/{id}/connect",
      ]);
      const fill = (info) => {
        if (origin && info.sandbox_id && !info.envd_url) info.envd_url = `${origin}/kruise/${info.sandbox_id}/${ENVD_PORT}`;
        return info;
      };
      const overrides = {
        create: async (config, opts) => fill(await inner.create(config, opts)),
        connect: async (id) => fill(await inner.connect(id)),
        getInfo: async (id) => fill(await inner.getInfo(id)),
        list: async (opts = {}) => {
          const params = { limit: String(opts.limit ?? 100) };
          if (opts.status) params.state = String(opts.status);
          if (opts.offset) params.offset = String(opts.offset);
          const response = await http.platformRequest("GET", "/v2/sandboxes", { params });
          const data = response.json();
          const items = Array.isArray(data) ? data : (data.sandboxes ?? data.data ?? []);
          return items.map((item) => fill(inner._info(item)));
        },
        hasPortUrl: origin !== null,
      };
      if (origin !== null) overrides.portUrl = async (id, port) => [`${origin}/kruise/${id}/${port}`, {}];

      const notContext = (op) => async () => {
        throw new kit.errors.ProviderFeatureNotSupportedError("alicloud-container", op, {
          suggestion: "code.interpret on alicloud-container is Jupyter POST /execute only; context RPCs are not available.",
        });
      };
      const code = {
        async runCode(_id, envdUrl, token, opts) {
          const [target, path] = executeTarget(envdUrl);
          const body = { code: opts.code ?? "", language: opts.language || "python" };
          if (opts.envs && Object.keys(opts.envs).length) body.env_vars = opts.envs;
          const response = await http.envdHttpRequest(target, "POST", path, {
            envd_token: token,
            headers: { "Content-Type": "application/json", "E2b-Sandbox-Port": String(CODE_PORT) },
            content: JSON.stringify(body),
          });
          return kit.e2b.parseExecution(response.text);
        },
        createContext: notContext("createContext"),
        listContexts: notContext("listContexts"),
        restartContext: notContext("restartContext"),
        removeContext: notContext("removeContext"),
      };

      return {
        auth,
        http_client: http,
        endpoint: { base_url: base, domain },
        sandbox_protocol: kit.e2b.overlay(inner, overrides),
        process_protocol: new kit.ProcessProtocol(http),
        filesystem_protocol: new kit.FilesystemProtocol(http),
        code_interpreter_protocol: code,
      };
    },
  };
}
