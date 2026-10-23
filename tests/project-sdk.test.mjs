import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createServer } from "node:http";
import { gunzipSync } from "node:zlib";
import { projectManager } from "../e2b/project.mjs";
const sdkPath = process.env.E2B_TEMPLATE_SDK_MODULE, helperPath = process.env.ABX_PROJECT_HELPER_MODULE;
test("actual official SDK project parser preserves COPY and uploads its real file with a scoped key", { skip: !sdkPath || !helperPath }, async () => {
  const { Template } = await import(sdkPath), project = await import(helperPath);
  const key = "e2b_" + "0".repeat(40);
  const work = await fs.mkdtemp(path.join(os.tmpdir(), "abx-sdk-project-"));
  const dockerfile = "FROM python:3.12-slim\nCOPY *.whl /tmp/\nRUN echo project-fixture\n";
  await fs.writeFile(path.join(work, "Dockerfile"), dockerfile);
  await fs.writeFile(path.join(work, "fixture.whl"), "project-wheel-fixture");
  const seen = [];
  const server = createServer(async (req, res) => {
    const chunks = []; for await (const chunk of req) chunks.push(chunk);
    const data = Buffer.concat(chunks);
    if (req.url === "/fixture-upload") {
      seen.push({ url: req.url, method: req.method, key: req.headers["x-api-key"], archive: gunzipSync(data) });
      res.statusCode = 200; res.end(); return;
    }
    seen.push({ url: req.url, method: req.method, key: req.headers["x-api-key"], body: data.length ? JSON.parse(data.toString()) : null });
    res.setHeader("content-type", "application/json");
    if (req.url.startsWith("/templates/sdk-template/files/")) {
      res.end(JSON.stringify({ present: false, url: `http://127.0.0.1:${server.address().port}/fixture-upload`, headers: { "x-upload-fixture": "scoped" } }));
    } else if (req.method === "GET") res.end(JSON.stringify({ templateID: "sdk-template", buildID: "sdk-build", status: "ready", logEntries: [], logs: [] }));
    else { res.statusCode = 202; res.end(req.url === "/v3/templates" ? JSON.stringify({ templateID: "sdk-template", buildID: "sdk-build", aliases: ["fixture"], names: ["fixture"], tags: ["latest"] }) : "{}"); }
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const stages = [];
  class ConfigError extends Error {}
  try {
    const kit = { errors: { ProviderConfigError: ConfigError, InvalidAPIKeyError: ConfigError }, e2b: { loadTemplate: async () => Template }, project: {
      stage: async (...args) => { const stage = await project.stageProject(...args); stages.push(stage.directory); return stage; },
    } };
    const manager = projectManager(kit, { options: { api_key: key, base_url: `http://127.0.0.1:${server.address().port}`, domain: "fixture.test" } });
    const result = await manager.prepareProject(work, { journal: { intent: async () => "intent", created: async () => {} }, alias: "fixture", timeout: 60, template: { cpu: 2, memory: 1024 } });
    assert.equal(result.reference, "sdk-template"); assert.equal(seen.length, 5);
    const upload = seen.find(r => r.url === "/fixture-upload");
    assert.equal(upload.method, "PUT"); assert.equal(upload.key, undefined);
    assert.ok(upload.archive.includes(Buffer.from("fixture.whl")));
    assert.ok(upload.archive.includes(Buffer.from("project-wheel-fixture")));
    assert.ok(seen.filter(r => r !== upload).every(r => r.key === key)); // fixture key only
    const build = seen.find(r => r.method === "POST" && r.url !== "/v3/templates").body;
    assert.equal(build.fromImage, "python:3.12-slim");
    assert.ok(build.steps.some(step => step.type === "COPY"));
    assert.equal(await fs.readFile(path.join(work, "Dockerfile"), "utf8"), dockerfile);
    for (const stage of stages) await assert.rejects(fs.stat(stage), { code: "ENOENT" });
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); await fs.rm(work, { recursive: true, force: true }); }
});
