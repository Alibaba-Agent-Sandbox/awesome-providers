/** Exact catalog source -> default or explicitly selected image -> native OpenSandbox application workflows. */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { randomBytes } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const run = promisify(execFile);
const work = await fs.mkdtemp(path.join(os.tmpdir(), "abx-project-live-"));
const cli = process.env.ABX_BIN;
const source = process.env.ABX_WORKFLOW_TEMPLATE_SOURCE;
assert.ok(cli, "ABX_BIN must be the reviewed built CLI wrapper");
assert.ok(source, "ABX_WORKFLOW_TEMPLATE_SOURCE must be the exact reviewed python-hello directory");
const profile = process.env.ABX_WORKFLOW_BUILD_PROFILE;
assert.ok(profile === undefined || profile === "portable", "Only the reviewed portable override is accepted");
let id;
let primaryFailure;
const env = { ...process.env, HOME: path.join(work, "home"), ABX_NO_KEYCHAIN: "1", NO_COLOR: "1",
  ABX_SERVER_TOKEN: randomBytes(24).toString("hex"),
  ABX_OPENSANDBOX_IMAGE_REPOSITORY: process.env.ABX_OPENSANDBOX_IMAGE_REPOSITORY || "localhost:5000/abx-project" };
const invoke = async args => (await run(cli, args, { env, cwd: work, timeout: 1200000, maxBuffer: 1024 * 1024 })).stdout;
try {
  await fs.mkdir(env.HOME);
  console.log("Explicit endpoint mode: " + (env.ABX_OPENSANDBOX_USE_SERVER_PROXY === "true" ? "server proxy" : "default direct"));
  await invoke(["provider", "install", process.env.ABX_OPENSANDBOX_PLUGIN, "-y"]);
  const result = JSON.parse(await invoke(["--provider", "opensandbox", "--json", "template", "launch", source,
    "--workflow", "application", ...(profile ? ["--build-profile", profile] : []), "--timeout", "900", "--sandbox-timeout", "540", "--yes"]));
  id = result.sandbox_id;
  assert.match(id, /^[a-zA-Z0-9-]+$/);
  assert.equal(result.workflow_id, "application"); assert.equal(result.build_profile, profile ?? null);
  assert.match(result.source_digest, /^(?:sha256:)?[a-f0-9]{64}$/);
  assert.match(result.template_reference, /^localhost:5000\/abx-project@sha256:[a-f0-9]{64}$/);
  console.log("PASS exact source/profile -> prepared image -> owned sandbox -> application readiness");
  const response = JSON.parse(await invoke(["--provider", "opensandbox", "--json", "run", id, "hello", "--arg", "name=OpenSandbox"]));
  assert.ok(JSON.stringify(response).includes("Hello, OpenSandbox!"));
  console.log("PASS CLI application HTTP named command");
  if (process.env.ABX_WORKFLOW_PROXY_PROBE === "1") {
    // Resolve through the public lifecycle API; never discover a Docker bridge address.
    const base = new URL(env.ABX_OPENSANDBOX_BASE_URL || "http://127.0.0.1:8080");
    const apiPath = base.pathname.replace(/\/$/, "").replace(/\/v1$/, "") + "/v1";
    const resolve = async proxy => {
      const endpoint = new URL(base);
      endpoint.pathname = `${apiPath}/sandboxes/${encodeURIComponent(id)}/endpoints/9000`;
      endpoint.search = proxy ? "use_server_proxy=true" : "";
      const headers = { "OPEN-SANDBOX-API-KEY": env.ABX_OPENSANDBOX_API_KEY || "local-dev-key" };
      const response = await fetch(endpoint, { headers, redirect: "error", signal: AbortSignal.timeout(15000) });
      assert.equal(response.status, 200, "public endpoint resolution status");
      const binding = await response.json();
      assert.equal(typeof binding.endpoint, "string", "public endpoint response schema");
      const url = new URL(/^[a-z]+:\/\//i.test(binding.endpoint) ? binding.endpoint : base.protocol + "//" + binding.endpoint);
      assert.ok(["http:", "https:"].includes(url.protocol) && !url.username && !url.password && !url.hash);
      if (proxy) assert.equal(url.origin, base.origin, "server proxy remains on configured lifecycle origin");
      const baseUrl = url.toString();
      url.pathname = url.pathname.replace(/\/$/, "") + "/commands/hello";
      return { url, baseUrl, headers: new Headers(binding.headers || {}) };
    };
    const call = async (binding, header, value) => {
      const headers = new Headers(binding.headers);
      assert.ok(!headers.has(header), "probe cannot replace a provider gateway credential");
      headers.set(header, value);
      headers.set("Content-Type", "application/json");
      const response = await fetch(binding.url, { method: "POST", headers,
        body: JSON.stringify({ name: "ProxyProbe" }), redirect: "error", signal: AbortSignal.timeout(15000) });
      if (response.status === 200) {
        const value = await response.json();
        assert.equal(value.result, "Hello, ProxyProbe!", "probe application result");
      }
      return response.status;
    };
    const direct = await resolve(false);
    const proxy = await resolve(true);
    const statuses = {
      direct_bearer: await call(direct, "Authorization", "Bearer " + env.ABX_SERVER_TOKEN),
      proxy_bearer: await call(proxy, "Authorization", "Bearer " + env.ABX_SERVER_TOKEN),
      proxy_access_token: await call(proxy, "X-Access-Token", env.ABX_SERVER_TOKEN),
    };
    // This is a protocol diagnostic, separate from default/direct acceptance.
    console.log("OpenSandbox 1.1.1 application authentication probe " + JSON.stringify(statuses));
    assert.equal(statuses.direct_bearer, 200, "direct Bearer application baseline");
    assert.equal(statuses.proxy_bearer, 401, "fixed upstream proxy strips Bearer authorization");
    assert.equal(statuses.proxy_access_token, 200, "existing service-token header crosses proxy");
    assert.equal(await call(proxy, "X-Access-Token", "intentionally-wrong"), 401, "proxy must reject an incorrect application token");
    if (env.ABX_WORKFLOW_NODE_CLIENT) {
      const { ServerClient } = await import(env.ABX_WORKFLOW_NODE_CLIENT);
      const nodeClient = new ServerClient(proxy.baseUrl, {
        token: env.ABX_SERVER_TOKEN, headers: Object.fromEntries(proxy.headers), timeout: 30,
      });
      try {
        const result = await nodeClient.send("run_command", "POST", "/commands/hello", { jsonBody: { name: "NodeProxy" } });
        assert.equal(result.result, "Hello, NodeProxy!", "independent Node SDK through the public proxy endpoint");
        console.log("PASS independent Node ServerClient named command through server proxy");
      } finally {
        await nodeClient.close();
      }
    }
  }
  // Both Python consumers use the exact prepared artifact, not Python source preparation.
  await run(process.env.PYTHON || "python", ["-c", `
import asyncio, os
from agent_sandbox import ProviderSandbox
from agent_sandbox.api.workflow import launch_workflow
async def main():
    sandbox = await ProviderSandbox.connect(os.environ['WORKFLOW_SANDBOX_ID'], provider='opensandbox')
    try:
        async with await sandbox.application_client(9000, token=os.environ['ABX_SERVER_TOKEN']) as client:
            result = await client.commands.run('hello', name='OpenSandbox')
            assert 'Hello, OpenSandbox!' in str(result)
    finally:
        await sandbox.close()
    session = await launch_workflow(os.environ['WORKFLOW_MANIFEST'], provider='opensandbox',
        workflow_id='application-image', reference=os.environ['WORKFLOW_IMAGE'],
        application_token=os.environ['ABX_SERVER_TOKEN'], timeout=180, readiness_timeout=60)
    async with session:
        assert 'Hello, OpenSandbox!' in str(await session.run_command('hello', name='OpenSandbox'))
    assert session.sandbox.id not in {item.sandbox_id for item in await ProviderSandbox.list(provider='opensandbox')}
asyncio.run(main())
`], { env: { ...env, WORKFLOW_SANDBOX_ID: id, WORKFLOW_MANIFEST: path.join(source, "template.yaml"), WORKFLOW_IMAGE: result.template_reference }, cwd: work, timeout: 240000, maxBuffer: 1024 * 1024 });
  console.log("PASS exact python-hello source/profile build -> OpenSandbox create/start/protocol -> CLI and Python application HTTP -> Python prepared-image workflow + owned cleanup");
} catch (error) {
  primaryFailure = error;
  throw error;
} finally {
  try {
    if (id) {
      await invoke(["--provider", "opensandbox", "kill", id, "--yes"]);
      const listed = JSON.parse(await invoke(["--provider", "opensandbox", "--json", "list"]));
      assert.ok(!JSON.stringify(listed).includes(id), "owned sandbox remains after cleanup");
    }
  } catch (error) {
    if (!primaryFailure) throw error;
    // Never replace the application failure with a secondary cleanup assertion.
    console.error("Secondary owned cleanup verification failed; the primary workflow error follows.");
  } finally {
    await fs.rm(work, { recursive: true, force: true });
  }
}
