// Native CubeAPI image builds. Contract reviewed at TencentCloud/CubeSandbox
// e0c1820ac2132df08bd4912e614486717275b956; this is not the E2B v3 SDK API.
import { setTimeout as delay } from "node:timers/promises";

const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const id = (value) => typeof value === "string" && /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(value);
const fields = (value, allowed) => object(value) && Object.keys(value).every((key) => allowed.includes(key));

export function createTemplates({ options = {}, errors, fetchImpl = globalThis.fetch }) {
  const invalid = (message) => new errors.ProviderConfigError(`Provider 'cubesandbox': ${message}`);
  let origin;
  try { origin = new URL(options.base_url || "http://127.0.0.1:3000"); }
  catch { throw invalid("base_url must be an HTTP(S) origin."); }
  if (!["http:", "https:"].includes(origin.protocol) || origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash) {
    throw invalid("base_url must be an HTTP(S) origin without credentials, path, query or fragment.");
  }
  if (options.api_key !== undefined && typeof options.api_key !== "string") throw invalid("api_key must be a string.");
  const key = options.api_key?.trim();

  return {
    async deploy(input) {
      if (!fields(input, ["source", "name", "spec", "registry", "timeout", "signal"])) throw invalid("unsupported deployment input.");
      const { source, name, spec = {}, registry = {}, timeout = 600, signal } = input;
      if (!fields(source, ["kind", "image"]) || source.kind !== "image" || typeof source.image !== "string" ||
        !/^[a-zA-Z0-9][a-zA-Z0-9._:/@-]*$/.test(source.image) || source.image.includes("://")) {
        throw invalid("source must contain a pushed OCI image reference without URL credentials or parameters.");
      }
      // CubeAPI otherwise silently drops invalid aliases and strips tags/namespaces.
      if (typeof name !== "string" || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(name) || /^(tpl-|snap-)/.test(name)) {
        throw invalid("name must be a lowercase Cube alias of at most 64 characters, without a namespace, tag or reserved prefix.");
      }
      if (!fields(spec, ["cpu", "memory"])) throw invalid("spec supports cpu and memory only; bake startup and envd readiness into the image.");
      for (const [field, max] of [["cpu", Math.floor(0xffffffff / 1000)], ["memory", 0xffffffff]]) {
        if (spec[field] !== undefined && (!Number.isSafeInteger(spec[field]) || spec[field] <= 0 || spec[field] > max)) throw invalid("CPU and memory must fit positive CubeAPI resource integers.");
      }
      if (!fields(registry, ["username", "password"])) throw invalid("registry accepts username and password only.");
      const hasRegistry = registry.username !== undefined || registry.password !== undefined;
      if (hasRegistry && (typeof registry.username !== "string" || !registry.username || typeof registry.password !== "string" || !registry.password)) throw invalid("registry requires both username and password.");
      if (typeof timeout !== "number" || !Number.isFinite(timeout) || timeout <= 0 || timeout > 3600) throw invalid("timeout must be greater than 0 and at most 3600 seconds.");
      if (signal !== undefined && !(signal instanceof AbortSignal)) throw invalid("signal must be an AbortSignal.");

      const deadline = new AbortController();
      const timer = setTimeout(() => deadline.abort(), Math.max(1, Math.ceil(timeout * 1000)));
      const onAbort = () => deadline.abort();
      if (signal?.aborted) onAbort();
      else signal?.addEventListener("abort", onAbort, { once: true });
      const combined = deadline.signal;
      const headers = { Accept: "application/json" };
      if (key) headers["X-API-Key"] = key;
      const request = async (method, path, body) => {
        const response = await fetchImpl(`${origin.origin}${path}`, {
          method, redirect: "error", signal: combined,
          headers: body ? { ...headers, "Content-Type": "application/json" } : headers,
          ...(body ? { body: JSON.stringify(body) } : {}),
        });
        // Never log or surface backend error bodies; they can contain registry keys.
        if (response.status !== (method === "POST" ? 202 : 200)) {
          await response.body?.cancel();
          throw new Error("Unexpected CubeAPI status");
        }
        return response.json();
      };
      try {
        combined.throwIfAborted();
        const body = { image: source.image, name, writableLayerSize: "1G", exposedPorts: [49983], probePort: 49983, probePath: "/health" };
        if (spec.cpu !== undefined) body.cpu = spec.cpu * 1000;
        if (spec.memory !== undefined) body.memory = spec.memory;
        if (hasRegistry) Object.assign(body, { registryUsername: registry.username, registryPassword: registry.password });
        const job = await request("POST", "/templates", body);
        if (!object(job) || !id(job.templateID) || !id(job.jobID)) throw new Error("Invalid CubeAPI job");
        // Submission alone never proves ready. Poll this exact owned job even if
        // the submission response claims READY, avoiding an unverified receipt.
        for (;;) {
          combined.throwIfAborted();
          const state = await request("GET", `/templates/${job.templateID}/builds/${job.jobID}/status`);
          if (!object(state) || state.templateID !== job.templateID || state.buildID !== job.jobID || typeof state.status !== "string") throw new Error("Invalid CubeAPI status");
          if (state.status === "ready") {
            combined.throwIfAborted();
            return { template_id: job.templateID, build_id: job.jobID, status: "ready", ref: source.image };
          }
          // CubeMaster's public status handler maps internal PENDING/RUNNING/
          // BUILT to "building", READY to "ready", and FAILED to "error".
          if (state.status !== "building") throw new Error("CubeAPI build did not become ready");
          await delay(500, undefined, { signal: combined });
        }
      } catch {
        if (combined.aborted) throw new Error("CubeSandbox image deployment cancelled or timed out; a submitted remote build may still exist.");
        throw new Error("CubeSandbox image deployment failed; inspect the build in the provider dashboard. A submitted remote build may still exist.");
      } finally {
        clearTimeout(timer);
        signal?.removeEventListener("abort", onAbort);
      }
    },
  };
}
