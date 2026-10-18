// Optional T1: built reviewed CLI -> installed adapter -> native API loopback.
// This fixture opts in locally; the catalog manifest remains disabled.
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const cliEntry = process.env.ABX_CLI_ENTRY;
assert.ok(cliEntry && path.isAbsolute(cliEntry), "Set ABX_CLI_ENTRY to the reviewed built CLI entry point");
const run = promisify(execFile);
const source = fileURLToPath(new URL("../", import.meta.url));
const work = await fs.mkdtemp(path.join(os.tmpdir(), "cube-template-host-"));
const seen = [];
const server = createServer(async (req, res) => {
  const chunks = []; for await (const chunk of req) chunks.push(chunk);
  seen.push({ method: req.method, path: req.url, key: req.headers["x-api-key"], body: chunks.length ? JSON.parse(Buffer.concat(chunks)) : undefined });
  res.setHeader("Content-Type", "application/json");
  if (req.method === "POST" && req.url === "/templates") {
    res.writeHead(202); res.end(JSON.stringify({ templateID: "tpl-contract", jobID: "job-contract", status: "PENDING" }));
  } else if (req.method === "GET" && req.url === "/templates/tpl-contract/builds/job-contract/status") {
    res.end(JSON.stringify({ templateID: "tpl-contract", buildID: "job-contract", status: "ready" }));
  } else { res.writeHead(404); res.end("{}"); }
});
try {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const plugin = path.join(work, "plugin");
  await fs.cp(source, plugin, { recursive: true });
  const manifest = path.join(plugin, "abx-provider.toml");
  await fs.writeFile(manifest, (await fs.readFile(manifest, "utf8")).replace("supported = [", 'supported = ["templates.deploy", '));
  const env = { PATH: process.env.PATH, HOME: path.join(work, "home"), NO_COLOR: "1", ABX_NO_KEYCHAIN: "1",
    ABX_CUBESANDBOX_API_KEY: "cube-fixture-key", ABX_CUBESANDBOX_BASE_URL: `http://127.0.0.1:${server.address().port}`,
    ABX_SANDBOX_API_KEY: "express-do-not-forward", E2B_API_KEY: "e2b-do-not-forward",
    ABX_IMAGE_REGISTRY_USERNAME: "fixture-user", ABX_IMAGE_REGISTRY_PASSWORD: "fixture-password" };
  await fs.mkdir(env.HOME);
  const cli = (args) => run(process.execPath, [cliEntry, ...args], { cwd: work, env, timeout: 30000, maxBuffer: 1024 * 1024 });
  await cli(["provider", "install", plugin, "-y"]);
  const { stdout, stderr } = await cli(["--provider", "cubesandbox", "--json", "template", "from-image", "registry.example.com/runtime:v1", "--name", "cube-contract", "--cpu", "2", "--memory", "1024", "--timeout", "10", "-y"]);
  assert.deepEqual(JSON.parse(stdout), { template_id: "tpl-contract", build_id: "job-contract", status: "ready", ref: "registry.example.com/runtime:v1" });
  assert.equal(seen.length, 2);
  assert.ok(seen.every((request) => request.key === env.ABX_CUBESANDBOX_API_KEY));
  assert.deepEqual(seen[0].body, { image: "registry.example.com/runtime:v1", name: "cube-contract", writableLayerSize: "1G", exposedPorts: [49983], probePort: 49983, probePath: "/health", cpu: 2000, memory: 1024, registryUsername: "fixture-user", registryPassword: "fixture-password" });
  for (const secret of [env.ABX_CUBESANDBOX_API_KEY, env.ABX_SANDBOX_API_KEY, env.E2B_API_KEY, env.ABX_IMAGE_REGISTRY_PASSWORD]) assert.ok(!(stdout + stderr).includes(secret));
  console.log("PASS: installed reviewed CLI dispatch, native CubeAPI loopback, CPU units, scoped credentials, private registry and safe ready result");
} finally {
  server.closeAllConnections(); await new Promise((resolve) => server.close(resolve));
  await fs.rm(work, { recursive: true, force: true });
}
