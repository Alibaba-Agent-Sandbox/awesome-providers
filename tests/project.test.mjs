import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { projectManager as e2b } from "../e2b/project.mjs";
import { projectManager as cube } from "../cubesandbox/project.mjs";
import { projectManager as osb } from "../opensandbox/src/project.mjs";
import { projectManager as container } from "../alicloud-container/project.mjs";
class ProviderConfigError extends Error {}
const errors = { ProviderConfigError, InvalidAPIKeyError: ProviderConfigError };
const request = { journal: { intent: async () => "intent", created: async () => {} }, alias: "fixture", timeout: 10, template: { name: "fixture", cpu: 2, memory: 1024, start_cmd: "python commands.py", ready_cmd: "healthcheck" } };

test("E2B project translation closes the staged tree and returns actual SDK result", async () => {
  let closed = 0, dockerfile;
  const Template = () => ({ fromDockerfile(file) { dockerfile = file; return this; }, setStartCmd() { return this; } });
  Template.build = async (_template, alias, options) => { assert.equal(alias, "fixture"); assert.equal(options.apiKey, "provider-only-key"); return { templateId: "actual-id", buildId: "actual-build" }; };
  const kit = { errors, e2b: { loadTemplate: async () => Template }, project: { stage: async () => ({ directory: "/staged", digest: "abc", close: async () => closed++ }) } };
  const result = await e2b(kit, { options: { api_key: "provider-only-key" } }).prepareProject("/source", request);
  assert.equal(result.reference, "actual-id"); assert.equal(result.status, "ready"); assert.equal(closed, 1); assert.equal(dockerfile, "/staged/Dockerfile");
});

test("Cube preparation uses native API registration, scoped credentials and millicores", async () => {
  const seen = [];
  const server = createServer(async (req, res) => {
    let body = ""; for await (const chunk of req) body += chunk;
    seen.push([req.method, req.url, req.headers["x-api-key"], body && JSON.parse(body)]); res.setHeader("content-type", "application/json");
    if (req.method === "POST") { res.statusCode = 202; res.end(JSON.stringify({ templateID: "native-id", jobID: "build-id" })); }
    else res.end(JSON.stringify({ templateID: "native-id", buildID: "build-id", status: "ready" }));
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    const options = { base_url: `http://127.0.0.1:${server.address().port}`, api_key: "cube-own-key", image_repository: "registry.example/project" };
    const result = await cube({ errors, project: { buildImage: async () => "registry.example/project:immutable" } }, { options }).prepareProject("/source", request);
    assert.equal(result.reference, "native-id"); assert.equal(result.startup_command, undefined);
    assert.equal(seen.length, 2); assert.ok(seen.every(r => r[2] === "cube-own-key")); assert.equal(seen[0][3].cpu, 2000);
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});

test("OpenSandbox returns the image directly and never invents a template ID", async () => {
  const result = await osb({ errors, project: { buildImage: async () => "registry.example/project:immutable" } }, { options: {} }).prepareProject("/source", request);
  assert.equal(result.reference, "registry.example/project:immutable"); assert.equal(result.template_id, undefined);
});

test("container preparation clones runtime details, scopes kubectl and reuses only owned SandboxSets", async () => {
  const base = { metadata: { uid: "base-uid", resourceVersion: "1", annotations: { inject: "runtime" } }, spec: { replicas: 2, template: { spec: {
    containers: [{ name: "sandbox", image: "native-base:version", lifecycle: { postStart: { exec: { command: ["runtime"] } } } }], initContainers: [{ name: "envd" }], volumes: [{ name: "envd" }] } } } };
  const calls = []; let created;
  const kit = { errors, project: { buildImage: async (_dir, opts) => { assert.equal(opts.base_image, undefined); assert.equal(opts.ensure_user, undefined); assert.equal(opts.optional_copy, undefined); return "registry.example/project:immutable"; }, runTool: async (command, args, opts) => {
    calls.push([command, args]); assert.deepEqual(args.slice(0, 4), ["--namespace", "team", "--context", "reviewed"]);
    if (args.includes("create")) { created = JSON.parse(opts.input); return "created"; }
    if (args.includes("--ignore-not-found")) return created ? JSON.stringify(created) : "";
    return JSON.stringify(base);
  } } };
  const manager = container(kit, { options: { kube_namespace: "team", kube_context: "reviewed", image_repository: "registry.example/project" } });
  const first = await manager.prepareProject("/source", request), second = await manager.prepareProject("/source", request);
  assert.equal(first.reference, second.reference); assert.match(first.reference, /^abx-fixture-/); assert.equal(created.spec.replicas, 0);
  assert.equal(created.spec.template.spec.initContainers[0].name, "envd"); assert.equal(created.spec.template.spec.containers[0].lifecycle.postStart.exec.command[0], "runtime");
  assert.equal(calls.filter(c => c[1].includes("create")).length, 1); assert.equal(first.metadata["e2b.agents.kruise.io/create-on-no-stock"], "true");
});

test("every catalog node entry registers preparation only behind its declared build gate", async () => {
  const kit = { errors: { ...errors, ProviderFeatureNotSupportedError: ProviderConfigError }, FilesystemProtocol: class {} };
  for (const name of ["e2b", "cubesandbox", "alicloud-container", "opensandbox"]) {
    const entry = await import(`../${name}/provider.mjs`);
    const plugin = entry.default(kit);
    await assert.rejects(plugin.buildTemplateManager({ id: name, features: new Set(), options: {} }), ProviderConfigError);
    const manager = await plugin.buildTemplateManager({ id: name, features: new Set(["templates.build"]), options: {} });
    assert.equal(typeof manager.prepareProject, "function");
  }
});

test("OpenSandbox preparation persists intent before image push and returns manual recovery ownership", async () => {
  const events = [];
  const journal = { intent: async input => { events.push(["intent", input]); return "image-intent"; }, created: async (intent, id) => { events.push(["created", intent, id]); } };
  const kit = { errors, project: { buildImage: async (_directory, options) => {
    assert.equal(options.base_image, undefined); assert.equal(options.ensure_user, undefined); assert.equal(options.optional_copy, undefined);
    const intent = await options.journal.intent({ kind: "image", correlation_key: "run", cleanup: "manual" });
    events.push(["push"]);
    await options.journal.created(intent, "registry.invalid/project@sha256:" + "a".repeat(64));
    return "registry.invalid/project@sha256:" + "a".repeat(64);
  } } };
  const manager = osb(kit, { options: {} });
  await assert.rejects(manager.prepareProject("/source", { ...request, journal: undefined }), /persistent ownership journal/);
  assert.equal(events.length, 0);
  const result = await manager.prepareProject("/source", { ...request, journal });
  assert.deepEqual(events.map(event => event[0]), ["intent", "push", "created"]);
  assert.equal(result.owned_resources.length, 1);
  assert.equal(result.owned_resources[0].cleanup, "manual");
  assert.equal(result.owned_resources[0].owned, true);
  assert.equal(result.startup_command, undefined);
});

test("explicit build profile reaches the image builder without rewriting the source recipe", async () => {
  const profile = { dockerfile: "Dockerfile.portable", context: "." };
  let observed;
  const manager = osb({ errors, project: { buildImage: async (directory, options) => {
    observed = { directory, options }; return "registry.invalid/hello@sha256:" + "a".repeat(64);
  } } }, { options: {} });
  await manager.prepareProject("/unchanged-source", { ...request, build_profile: profile });
  assert.equal(observed.directory, "/unchanged-source");
  assert.equal(observed.options.dockerfile, "Dockerfile.portable");
  assert.equal(observed.options.base_image, undefined);
});
