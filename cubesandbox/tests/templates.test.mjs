import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createTemplates } from "../templates.mjs";
import create from "../provider.mjs";

const errors = { ProviderConfigError: class extends Error {}, ProviderFeatureNotSupportedError: class extends Error {} };
const input = { source: { kind: "image", image: "registry.example.com/runtime:v1" }, name: "runtime" };
const job = { templateID: "tpl-test", jobID: "job-test", status: "PENDING" };
const state = (status = "ready") => ({ templateID: job.templateID, buildID: job.jobID, status });
const response = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const adapter = (fetchImpl, options = {}) => createTemplates({ options, errors, fetchImpl });

test("pinned upstream native HTTP contract: submission, public building/ready status and result allowlist", async () => {
  const seen = [];
  let poll = 0;
  const server = createServer(async (req, res) => {
    const chunks = []; for await (const chunk of req) chunks.push(chunk);
    seen.push({ method: req.method, url: req.url, key: req.headers["x-api-key"], body: chunks.length ? JSON.parse(Buffer.concat(chunks)) : undefined });
    res.setHeader("Content-Type", "application/json");
    if (req.method === "POST" && req.url === "/templates") { res.writeHead(202); res.end(JSON.stringify(job)); }
    else if (req.method === "GET" && req.url === "/templates/tpl-test/builds/job-test/status") res.end(JSON.stringify({ ...state(["building", "building", "ready"][poll++]), message: poll === 2 ? "BUILT" : "RUNNING", logs: "not-returned" }));
    else { res.writeHead(404); res.end("{}"); }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const own = adapter(globalThis.fetch, { base_url: `http://127.0.0.1:${server.address().port}`, api_key: "cube-own-key" });
    const result = await own.deploy({ ...input, spec: { cpu: 2, memory: 2048 }, registry: { username: "fixture-user", password: "fixture-password" } });
    assert.deepEqual(result, { template_id: "tpl-test", build_id: "job-test", status: "ready", ref: input.source.image });
    assert.equal(seen.length, 4);
    assert.ok(seen.every((request) => request.key === "cube-own-key"));
    assert.deepEqual(seen[0].body, { image: input.source.image, name: "runtime", writableLayerSize: "1G", exposedPorts: [49983], probePort: 49983, probePath: "/health", cpu: 2000, memory: 2048, registryUsername: "fixture-user", registryPassword: "fixture-password" });
    assert.ok(seen.slice(1).every((request) => request.body === undefined));
  } finally {
    server.closeAllConnections(); await new Promise((resolve) => server.close(resolve));
  }
});

test("optional key is omitted; unrelated ambient credentials are never selected", async () => {
  const saved = [process.env.ABX_SANDBOX_API_KEY, process.env.E2B_API_KEY, process.env.CUBE_API_KEY];
  Object.assign(process.env, { ABX_SANDBOX_API_KEY: "express-secret", E2B_API_KEY: "e2b-secret", CUBE_API_KEY: "ambient-cube-secret" });
  let calls = 0;
  try {
    await adapter(async (_url, init) => { assert.equal(init.headers["X-API-Key"], undefined); return response(calls++ ? state() : job, calls === 1 ? 202 : 200); }).deploy(input);
    assert.equal(calls, 2);
  } finally {
    ["ABX_SANDBOX_API_KEY", "E2B_API_KEY", "CUBE_API_KEY"].forEach((key, i) => saved[i] === undefined ? delete process.env[key] : process.env[key] = saved[i]);
  }
});

test("invalid options fail before requests and never echo their values", () => {
  for (const options of [{ base_url: "https://secret:password@example.com" }, { base_url: "https://example.com/path" }, { base_url: "file:///secret" }, { api_key: {} }]) {
    assert.throws(() => adapter(() => assert.fail("network"), options), errors.ProviderConfigError);
  }
});

test("unknown, unsupported and lossy fields fail before any request", async () => {
  const invalid = [
    null, [], { ...input, source: { kind: "steps", image: "runtime" } },
    { ...input, source: { ...input.source, file: "private" } },
    { ...input, source: { kind: "image", image: "https://user:secret@example.com/image" } },
    { ...input, name: "name:v1" }, { ...input, name: "ns/name" }, { ...input, name: "UPPER" },
    { ...input, name: "tpl-reserved" }, { ...input, name: "snap-reserved" },
    { ...input, spec: { start_cmd: "secret" } }, { ...input, spec: { ready_cmd: "secret" } },
    { ...input, spec: { cpu: 1.5 } }, { ...input, spec: { cpu: 0xffffffff } },
    { ...input, spec: { memory: 0 } }, { ...input, spec: { memory: 0x100000000 } },
    { ...input, registry: { username: "secret" } }, { ...input, registry: { password: "secret" } },
    { ...input, registry: { username: "user", password: "pass", endpoint: "private" } },
    { ...input, timeout: 0 }, { ...input, timeout: 3601 }, { ...input, timeout: Infinity },
    { ...input, signal: {} }, { ...input, secret: "value" },
  ];
  for (const value of invalid) await assert.rejects(adapter(() => assert.fail("network")).deploy(value), errors.ProviderConfigError);
});

test("failed or malformed submission/status never produces ready and hides all raw details", async () => {
  for (const [submission, next] of [[{}, state()], [{ ...job, jobID: "../secret" }, state()], [job, state("error")], [job, state("unknown")], [job, state("READY")], [job, { ...state(), buildID: "other" }], [job, { ...state(), templateID: "other" }], [job, {}]]) {
    let count = 0;
    const own = adapter(async () => response(count++ ? { ...next, message: "raw secret" } : submission, count === 1 ? 202 : 200));
    await assert.rejects(own.deploy(input), (error) => error.message.includes("deployment failed") && !error.message.includes("secret") && !error.cause);
  }
});

test("HTTP errors and redirects are private and never retried", async () => {
  for (const status of [302, 401, 500]) {
    let calls = 0;
    await assert.rejects(adapter(async (_url, init) => { calls++; assert.equal(init.redirect, "error"); return response({ message: "private registry secret" }, status); }).deploy(input), /deployment failed/);
    assert.equal(calls, 1);
  }
});

test("a real HTTP redirect never forwards provider or registry credentials", async () => {
  let forwarded = 0;
  const trap = createServer((_req, res) => { forwarded++; res.end("{}"); });
  const redirect = createServer((_req, res) => {
    res.writeHead(307, { Location: `http://127.0.0.1:${trap.address().port}/collect` }); res.end();
  });
  await new Promise((resolve) => trap.listen(0, "127.0.0.1", resolve));
  await new Promise((resolve) => redirect.listen(0, "127.0.0.1", resolve));
  try {
    const own = adapter(globalThis.fetch, { base_url: `http://127.0.0.1:${redirect.address().port}`, api_key: "private-key" });
    await assert.rejects(own.deploy({ ...input, registry: { username: "private-user", password: "private-password" } }), /deployment failed/);
    assert.equal(forwarded, 0);
  } finally {
    for (const server of [redirect, trap]) { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); }
  }
});

test("pre-cancelled requests do not submit and hide arbitrary abort reasons", async () => {
  await assert.rejects(adapter(() => assert.fail("network")).deploy({ ...input, signal: AbortSignal.abort("private-secret") }), (error) => /cancelled/.test(error.message) && !error.message.includes("private-secret"));
});

test("deadline aborts the request; caller abort also stops polling", async () => {
  let seenSignal;
  await assert.rejects(adapter((_url, init) => new Promise((_resolve, reject) => {
    seenSignal = init.signal;
    init.signal.addEventListener("abort", () => reject(new Error("private SDK reason")), { once: true });
  })).deploy({ ...input, timeout: 0.01 }), /timed out/);
  assert.equal(seenSignal.aborted, true);
  const controller = new AbortController(); let count = 0;
  await assert.rejects(adapter(async () => {
    count++;
    if (count === 2) controller.abort("private abort");
    return response(count === 1 ? job : state("building"), count === 1 ? 202 : 200);
  }).deploy({ ...input, signal: controller.signal }), /cancelled/);
  assert.equal(count, 2);
});




test("project manager requires templates.build before any build work", async () => {
  const plugin = create({ FilesystemProtocol: class {}, errors });
  assert.equal(plugin.buildTemplates, undefined);
  await assert.rejects(plugin.buildTemplateManager({ id: "cubesandbox", features: new Set(), options: {} }), errors.ProviderFeatureNotSupportedError);
  const manager = await plugin.buildTemplateManager({ id: "cubesandbox", features: new Set(["templates.build"]), options: {} });
  assert.equal(typeof manager.prepareProject, "function");
});
