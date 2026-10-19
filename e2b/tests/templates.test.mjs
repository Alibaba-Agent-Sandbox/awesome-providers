import assert from "node:assert/strict";
import test from "node:test";
import create from "../provider.mjs";
import { createTemplates } from "../templates.mjs";

class ProviderConfigError extends Error {}
class InvalidAPIKeyError extends Error {}
class ProviderFeatureNotSupportedError extends Error {}
const errors = { ProviderConfigError, InvalidAPIKeyError, ProviderFeatureNotSupportedError };
const request = () => ({ source: { kind: "image", image: "docker.io/example/runtime:v1" }, name: "runtime:v1" });
function setup(build) {
  const calls = [];
  function Template() {
    return {
      fromImage(...args) { calls.push(["fromImage", ...args]); return this; },
      setStartCmd(...args) { calls.push(["setStartCmd", ...args]); return this; },
      setReadyCmd(...args) { calls.push(["setReadyCmd", ...args]); return this; },
    };
  }
  Template.build = async (...args) => { calls.push(["build", ...args]); return build ? build(...args) : { templateId: "tpl-1", buildId: "bld-1" }; };
  return { Template, calls, adapter: createTemplates({ Template, options: { api_key: "test-provider-key" }, errors }) };
}

test("deploy returns ready only after official SDK build completes, with explicit scoped options", async () => {
  const { adapter, calls } = setup();
  const result = await adapter.deploy({ ...request(), spec: { cpu: 2, memory: 2048, start_cmd: "node server.js", ready_cmd: "curl localhost:9000" } });
  assert.deepEqual(result, { template_id: "tpl-1", build_id: "bld-1", status: "ready", ref: request().source.image });
  assert.deepEqual(calls[0], ["fromImage", request().source.image, undefined]);
  assert.deepEqual(calls[1], ["setStartCmd", "node server.js", "curl localhost:9000"]);
  const opts = calls.at(-1)[3];
  assert.equal(opts.apiKey, "test-provider-key");
  assert.equal(opts.apiUrl, "https://api.e2b.app");
  assert.equal(opts.domain, "e2b.app");
  assert.equal(opts.cpuCount, 2);
  assert.equal(opts.memoryMB, 2048);
  assert.equal(opts.debug, false);
  assert.equal(opts.retries, 0);
  assert.equal(opts.httpVersion, "1.1");
  assert.equal(opts.onBuildLogs, undefined);
  assert.ok(opts.signal instanceof AbortSignal);
});

test("explicit endpoint and registry credentials reach only SDK build", async () => {
  const { Template, calls } = setup();
  const adapter = createTemplates({ Template, errors, options: { api_key: "scoped", base_url: "http://127.0.0.1:1234/", domain: "custom.example" } });
  await adapter.deploy({ ...request(), registry: { username: "registry-user", password: "registry-pass" }, spec: { ready_cmd: "true" } });
  assert.deepEqual(calls[0][2], { username: "registry-user", password: "registry-pass" });
  assert.deepEqual(calls[1], ["setReadyCmd", "true"]);
  assert.equal(calls.at(-1)[3].apiUrl, "http://127.0.0.1:1234");
  assert.equal(calls.at(-1)[3].domain, "custom.example");
});

test("missing provider key refuses before SDK construction despite ambient generic keys", () => {
  const previous = process.env.E2B_API_KEY;
  process.env.E2B_API_KEY = "ambient-express-key";
  try { assert.throws(() => createTemplates({ ...setup(), options: {}, errors }), InvalidAPIKeyError); }
  finally { if (previous === undefined) delete process.env.E2B_API_KEY; else process.env.E2B_API_KEY = previous; }
});

test("missing SDK and unsafe endpoint are configuration errors", () => {
  assert.throws(() => createTemplates({ options: { api_key: "key" }, errors }), ProviderConfigError);
  for (const base_url of ["file:///tmp/x", "https://user:pass@example.com", "https://example.com/path", "https://example.com/?secret=x"]) {
    assert.throws(() => createTemplates({ Template: setup().Template, options: { api_key: "key", base_url }, errors }), ProviderConfigError);
  }
});

test("unsupported fields and invalid values fail before network or SDK builder calls", async () => {
  const invalid = [
    { source: { kind: "dockerfile", dockerfile: "FROM python" } }, { source: { kind: "image", image: "https://user:pass@example.com/image" } },
    { name: "bad name" }, { spec: { generation: 2 } }, { spec: { generation: null } }, { spec: { disk: 20 } }, { spec: { env: { SECRET: "value" } } },
    { spec: { cpu: 0 } }, { spec: { memory: 0.5 } }, { spec: { start_cmd: "node server.js" } },
    { spec: { ready_cmd: "" } }, { registry: { username: "one" } }, { registry: { username: "one", password: "two", extra: true } },
    { timeout: 0 }, { timeout: Infinity }, { timeout: 3601 }, { signal: {} }, { force: true },
  ];
  for (const patch of invalid) {
    const { adapter, calls } = setup();
    await assert.rejects(adapter.deploy({ ...request(), ...patch }), ProviderConfigError);
    assert.equal(calls.length, 0);
  }
});

test("remote error omits all raw text and discards raw cause/stack", async () => {
  const { adapter } = setup(() => { throw new Error("server: test-provider-key registry-pass registry-user"); });
  await assert.rejects(adapter.deploy({ ...request(), registry: { username: "registry-user", password: "registry-pass" } }), (error) => {
    assert.doesNotMatch(error.stack, /test-provider-key|registry-user|registry-pass/);
    assert.doesNotMatch(error.message, /server:/);
    assert.equal(error.cause, undefined);
    return true;
  });
});

test("invalid field names and values never appear in errors", async () => {
  const { adapter } = setup();
  const credential = "private-field-credential";
  for (const input of [
    { ...request(), [credential]: true },
    { ...request(), spec: { [credential]: true } },
    { ...request(), source: { kind: "image", image: credential + "?unsafe" } },
    { ...request(), name: credential + " bad name" },
  ]) {
    await assert.rejects(adapter.deploy(input), (error) => {
      assert.doesNotMatch(error.stack, new RegExp(credential));
      return true;
    });
  }
});

test("malformed SDK completion never becomes ready", async () => {
  const { adapter } = setup(() => ({ templateId: "tpl-1" }));
  await assert.rejects(adapter.deploy(request()), /deployment failed/);
});

test("failure retains validated HTTP status but never encoded remote credentials", async () => {
  const { adapter } = setup(() => { throw Object.assign(new Error(Buffer.from("test-provider-key").toString("base64")), { statusCode: 401 }); });
  await assert.rejects(adapter.deploy(request()), (error) => {
    assert.match(error.message, /HTTP 401/);
    assert.doesNotMatch(error.stack, new RegExp(Buffer.from("test-provider-key").toString("base64")));
    return true;
  });
});

test("pre-cancelled deployment does not submit; arbitrary cancellation reason is hidden", async () => {
  const { adapter, calls } = setup();
  await assert.rejects(adapter.deploy({ ...request(), signal: AbortSignal.abort("secret-reason") }), /cancelled or timed out/);
  assert.equal(calls.length, 0);
});

test("timeout cancels SDK work and cannot produce ready", async () => {
  const { adapter } = setup((_template, _name, options) => new Promise((resolve, reject) => options.signal.addEventListener("abort", () => reject(new Error("raw backend state")), { once: true })));
  await assert.rejects(adapter.deploy({ ...request(), timeout: 0.01 }), /submitted remote build may still exist/);
});

test("provider factory enforces deploy feature and does not alias coarse build support", async () => {
  const { Template } = setup();
  const plugin = create({ e2b: { Template }, errors });
  await assert.rejects(plugin.buildTemplates({ options: { api_key: "key" }, features: new Set(["templates.build"]) }), ProviderFeatureNotSupportedError);
  const adapter = await plugin.buildTemplates({ options: { api_key: "key" }, features: new Set(["templates.deploy"]) });
  assert.equal(typeof adapter.deploy, "function");
  assert.equal(adapter.delete, undefined);
  assert.equal(adapter.list, undefined);
});


test("template SDK helper is requested explicitly only after feature opt-in", async () => {
  const { Template } = setup();
  let loaded = 0;
  const plugin = create({ e2b: { async loadTemplate() { loaded++; return Template; } }, errors });
  assert.equal(loaded, 0);
  await assert.rejects(plugin.buildTemplates({ options: { api_key: "key" }, features: new Set(["templates.build"]) }), ProviderFeatureNotSupportedError);
  assert.equal(loaded, 0);
  const adapter = await plugin.buildTemplates({ options: { api_key: "key" }, features: new Set(["templates.deploy"]) });
  assert.equal(loaded, 1);
  assert.equal(typeof adapter.deploy, "function");
});
