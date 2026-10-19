// Narrow image-to-template adapter. The host supplies the official E2B Template SDK;
// plugins never install packages or borrow the SDK's E2B_* environment defaults.

const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const present = (value) => value !== undefined && value !== null;

export function createTemplates({ Template, options = {}, errors, fromProject }) {
  const invalid = (message) => new errors.ProviderConfigError(`Provider 'e2b': ${message}`);
  const key = typeof options.api_key === "string" ? options.api_key.trim() : "";
  if (!key) throw new errors.InvalidAPIKeyError("Provider 'e2b' has no API key.", { suggestion: "Set ABX_E2B_API_KEY." });
  if (typeof Template !== "function" || typeof Template.build !== "function") {
    throw invalid("image deployment needs a host with the official E2B Template SDK.");
  }
  const apiUrl = options.base_url || "https://api.e2b.app";
  let origin;
  try { origin = new URL(apiUrl); } catch { throw invalid("base_url must be an HTTP(S) origin."); }
  if (!["https:", "http:"].includes(origin.protocol) || origin.username || origin.password || origin.search || origin.hash || origin.pathname !== "/") {
    throw invalid("base_url must be an HTTP(S) origin without credentials, path, query or fragment.");
  }
  const domain = options.domain || "e2b.app";
  if (typeof domain !== "string" || !/^[a-zA-Z0-9.-]+(?::\d+)?$/.test(domain)) throw invalid("domain must be a hostname.");

  return {
    async deploy(input) {
      if (!object(input)) throw invalid("deploy needs an object.");
      for (const name of Object.keys(input)) {
        if (!["source", "name", "spec", "registry", "timeout", "signal"].includes(name)) throw invalid("unsupported deploy field.");
      }
      const { source, name, spec = {}, registry = {}, timeout = 600, signal } = input;
      if (!object(source) || source.kind !== "image" || Object.keys(source).some((k) => !["kind", "image"].includes(k))) {
        throw invalid("this deployment adapter accepts source.kind 'image' only; build and push local files first.");
      }
      if (typeof source.image !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9._:/@-]*$/.test(source.image) || source.image.includes("://")) {
        throw invalid("source.image must be a pullable OCI image reference, without credentials or URL parameters.");
      }
      if (typeof name !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9._/-]*(?::[a-zA-Z0-9][a-zA-Z0-9._-]*)?$/.test(name)) throw invalid("name must be a template name, optionally with a tag.");
      if (!object(spec)) throw invalid("spec must be an object.");
      for (const field of Object.keys(spec)) {
        if (!["cpu", "memory", "start_cmd", "ready_cmd"].includes(field)) throw invalid("unsupported template spec field.");
      }
      for (const field of ["cpu", "memory"]) {
        if (present(spec[field]) && (!Number.isSafeInteger(spec[field]) || spec[field] <= 0)) throw invalid(`${field} must be a positive integer.`);
      }
      for (const field of ["start_cmd", "ready_cmd"]) {
        if (present(spec[field]) && (typeof spec[field] !== "string" || !spec[field].trim())) throw invalid(`${field} must be a nonempty string.`);
      }
      if (present(spec.start_cmd) && !present(spec.ready_cmd)) throw invalid("start_cmd requires ready_cmd so readiness is verified before snapshotting.");
      if (!object(registry) || Object.keys(registry).some((k) => !["username", "password"].includes(k))) throw invalid("registry accepts username and password only.");
      const hasRegistry = present(registry.username) || present(registry.password);
      if (hasRegistry && (typeof registry.username !== "string" || !registry.username || typeof registry.password !== "string" || !registry.password)) {
        throw invalid("private registry deployment requires both username and password.");
      }
      if (typeof timeout !== "number" || !Number.isFinite(timeout) || timeout <= 0 || timeout > 3600) throw invalid("timeout must be greater than 0 and at most 3600 seconds.");
      if (signal !== undefined && !(signal instanceof AbortSignal)) throw invalid("signal must be an AbortSignal.");
      // A clearable timer bounds the whole build and does not remain alive after a fast build.
      const deadline = new AbortController();
      const timer = setTimeout(() => deadline.abort(), Math.max(1, Math.ceil(timeout * 1000)));
      const combined = signal ? AbortSignal.any([signal, deadline.signal]) : deadline.signal;
      try {
        combined.throwIfAborted();
        let template = fromProject ? fromProject() : Template().fromImage(source.image, hasRegistry ? { username: registry.username, password: registry.password } : undefined);
        if (present(spec.start_cmd)) template = template.setStartCmd(spec.start_cmd, spec.ready_cmd);
        else if (present(spec.ready_cmd)) template = template.setReadyCmd(spec.ready_cmd);
        const buildOptions = {
          apiKey: key, apiUrl: origin.origin, domain, debug: false, retries: 0, httpVersion: "1.1",
          requestTimeoutMs: Math.min(60000, Math.max(1, Math.ceil(timeout * 1000))),
          signal: combined,
          // Do not attach logger/onBuildLogs: SDK output can include registry secrets.
        };
        if (present(spec.cpu)) buildOptions.cpuCount = spec.cpu;
        if (present(spec.memory)) buildOptions.memoryMB = spec.memory;
        const result = await Template.build(template, name, buildOptions);
        combined.throwIfAborted();
        if (!result || typeof result.templateId !== "string" || !result.templateId || typeof result.buildId !== "string" || !result.buildId) {
          throw new Error("The E2B Template SDK returned no template/build id.");
        }
        return { template_id: result.templateId, build_id: result.buildId, status: "ready", ref: source.image };
      } catch (error) {
        if (combined.aborted) throw new Error("E2B template deployment cancelled or timed out; a submitted remote build may still exist.");
        // Remote error text can echo credentials in encodings we cannot enumerate.
        // Retain only a validated status code; do not attach raw text, cause or stack.
        const status = Number.isInteger(error?.statusCode) && error.statusCode >= 400 && error.statusCode <= 599 ? ` (HTTP ${error.statusCode})` : "";
        throw new Error(`E2B template deployment failed${status}; inspect the build in the provider dashboard. A submitted remote build may still exist.`);
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
