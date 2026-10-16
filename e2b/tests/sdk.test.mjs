// Optional contract check with the actual pinned official SDK against loopback HTTP.
// E2B_TEMPLATE_SDK_MODULE is a file URL to e2b@2.55.0's dist/index.mjs.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import { createTemplates } from "../templates.mjs";

test("official E2B 2.55 SDK executes v3 create, v2 trigger and ready polling against loopback", { skip: !process.env.E2B_TEMPLATE_SDK_MODULE && "set E2B_TEMPLATE_SDK_MODULE to installed e2b@2.55.0" }, async () => {
  const { Template } = await import(process.env.E2B_TEMPLATE_SDK_MODULE);
  const requests = [];
  const server = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks).toString();
    requests.push({ method: req.method, path: req.url, key: req.headers["x-api-key"], body: body ? JSON.parse(body) : undefined });
    res.setHeader("Content-Type", "application/json");
    if (req.method === "POST" && req.url === "/v3/templates") {
      res.statusCode = 202;
      res.end(JSON.stringify({ templateID: "tpl-test", buildID: "bld-test", aliases: ["contract"], names: ["contract"], tags: ["latest"] }));
    } else if (req.method === "POST" && req.url === "/v2/templates/tpl-test/builds/bld-test") {
      res.statusCode = 202; res.end("{}");
    } else if (req.method === "GET" && req.url.startsWith("/templates/tpl-test/builds/bld-test/status")) {
      res.end(JSON.stringify({ templateID: "tpl-test", buildID: "bld-test", status: "ready", logEntries: [], logs: [] }));
    } else { res.statusCode = 404; res.end(JSON.stringify({ message: "unexpected path" })); }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const adapter = createTemplates({ Template, errors: { ProviderConfigError: Error, InvalidAPIKeyError: Error }, options: { api_key: `e2b_${"0".repeat(40)}`, base_url: `http://127.0.0.1:${server.address().port}` } });
    const result = await adapter.deploy({ source: { kind: "image", image: "python:3.12-slim" }, name: "contract", spec: { cpu: 2, memory: 1024, start_cmd: "python server.py", ready_cmd: "curl localhost:9000" }, timeout: 10 });
    assert.equal(result.template_id, "tpl-test");
    assert.equal(result.build_id, "bld-test");
    assert.equal(requests.length, 3);
    assert.ok(requests.every((request) => request.key === `e2b_${"0".repeat(40)}`));
    assert.deepEqual(requests[0].body, { name: "contract", cpuCount: 2, memoryMB: 1024 });
    assert.equal(requests[1].body.fromImage, "python:3.12-slim");
    assert.equal(requests[1].body.startCmd, "python server.py");
    assert.equal(requests[1].body.readyCmd, "curl localhost:9000");
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});
