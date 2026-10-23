import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createServer } from "node:http";
import { projectManager } from "../e2b/project.mjs";
const sdkPath = process.env.E2B_TEMPLATE_SDK_MODULE, helperPath = process.env.ABX_PROJECT_HELPER_MODULE;
test("actual official SDK project parser -> three native protocol requests with scoped key", { skip: !sdkPath || !helperPath }, async () => {
  const { Template } = await import(sdkPath), project = await import(helperPath);
  const key = "e2b_" + "0".repeat(40);
  const work = await fs.mkdtemp(path.join(os.tmpdir(), "abx-sdk-project-"));
  const dockerfile = "FROM python:3.12-slim\nCOPY *.whl /tmp/\nRUN echo project-fixture\n";
  await fs.writeFile(path.join(work, "Dockerfile"), dockerfile);
  const seen = [];
  const server = createServer(async (req, res) => {
    let data = ""; for await (const chunk of req) data += chunk;
    seen.push({ url: req.url, key: req.headers["x-api-key"], body: data ? JSON.parse(data) : null });
    res.setHeader("content-type", "application/json");
    if (req.method === "GET") res.end(JSON.stringify({ templateID: "sdk-template", buildID: "sdk-build", status: "ready", logEntries: [], logs: [] }));
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
    const result = await manager.prepareProject(work, { journal: { intent: async () => "intent", created: async () => {} }, alias: "fixture", timeout: 10, template: { cpu: 2, memory: 1024 } });
    assert.equal(result.reference, "sdk-template"); assert.equal(seen.length, 3);
    assert.ok(seen.every(r => r.key === key)); // fixture key only
    assert.equal(seen[1].body.fromImage, "python:3.12-slim"); assert.ok(seen[1].body.steps.length > 0);
    assert.equal(await fs.readFile(path.join(work, "Dockerfile"), "utf8"), dockerfile);
    for (const stage of stages) await assert.rejects(fs.stat(stage), { code: "ENOENT" });
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); await fs.rm(work, { recursive: true, force: true }); }
});
