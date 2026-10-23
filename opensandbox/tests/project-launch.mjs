/** Exact catalog source -> portable image -> native OpenSandbox application workflows. */
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
let id;
const env = { ...process.env, HOME: path.join(work, "home"), ABX_NO_KEYCHAIN: "1", NO_COLOR: "1",
  ABX_SERVER_TOKEN: randomBytes(24).toString("hex"),
  ABX_OPENSANDBOX_IMAGE_REPOSITORY: process.env.ABX_OPENSANDBOX_IMAGE_REPOSITORY || "localhost:5000/abx-project" };
const invoke = async args => (await run(cli, args, { env, cwd: work, timeout: 600000, maxBuffer: 1024 * 1024 })).stdout;
try {
  await fs.mkdir(env.HOME);
  await invoke(["provider", "install", process.env.ABX_OPENSANDBOX_PLUGIN, "-y"]);
  const result = JSON.parse(await invoke(["--provider", "opensandbox", "--json", "template", "launch", source,
    "--workflow", "application", "--build-profile", "portable", "--timeout", "540", "--sandbox-timeout", "540", "--yes"]));
  id = result.sandbox_id;
  assert.match(id, /^[a-zA-Z0-9-]+$/);
  assert.equal(result.workflow_id, "application"); assert.equal(result.build_profile, "portable");
  assert.match(result.source_digest, /^(?:sha256:)?[a-f0-9]{64}$/);
  assert.match(result.template_reference, /^localhost:5000\/abx-project/);
  const response = JSON.parse(await invoke(["--provider", "opensandbox", "--json", "run", id, "hello", "--arg", "name=OpenSandbox"]));
  assert.ok(JSON.stringify(response).includes("Hello, OpenSandbox!"));
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
} finally {
  if (id) {
    await invoke(["--provider", "opensandbox", "kill", id, "--yes"]);
    const listed = JSON.parse(await invoke(["--provider", "opensandbox", "--json", "list"]));
    assert.ok(!JSON.stringify(listed).includes(id), "owned sandbox remains after cleanup");
  }
  await fs.rm(work, { recursive: true, force: true });
}
