/** Native Docker/OpenSandbox project launch. Run on the isolated T4 runner with its local registry. */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const run = promisify(execFile);
const work = await fs.mkdtemp(path.join(os.tmpdir(), "abx-project-live-"));
const cli = process.env.ABX_BIN;
assert.ok(cli, "ABX_BIN must be the reviewed built CLI wrapper");
let id;
const env = { ...process.env, HOME: path.join(work, "home"), ABX_NO_KEYCHAIN: "1", NO_COLOR: "1",
  ABX_OPENSANDBOX_IMAGE_REPOSITORY: process.env.ABX_OPENSANDBOX_IMAGE_REPOSITORY || "localhost:5000/abx-project" };
const invoke = async args => (await run(cli, args, { env, cwd: work, timeout: 240000, maxBuffer: 1024 * 1024 })).stdout;
try {
  await fs.mkdir(env.HOME);
  await fs.writeFile(path.join(work, "template.yaml"), `name: native-project\nbase: python:3.12-slim\ncapabilities: [shell, files, ports]\nstart_cmd: python3 /app/server.py\nready_cmd: python3 -c "import urllib.request; assert urllib.request.urlopen('http://127.0.0.1:9000').read() == b'project-ready'"\n`);
  await fs.writeFile(path.join(work, "Dockerfile"), "FROM python:3.12-slim\nWORKDIR /app\nCOPY server.py /app/server.py\n");
  await fs.writeFile(path.join(work, "server.py"), "from http.server import BaseHTTPRequestHandler,HTTPServer\nclass H(BaseHTTPRequestHandler):\n def do_GET(self):\n  self.send_response(200);self.end_headers();self.wfile.write(b'project-ready')\nHTTPServer(('0.0.0.0',9000),H).serve_forever()\n");
  await invoke(["provider", "install", process.env.ABX_OPENSANDBOX_PLUGIN, "-y"]);
  const result = JSON.parse(await invoke(["--provider", "opensandbox", "--json", "template", "launch", work, "--timeout", "180", "--sandbox-timeout", "180", "--yes"]));
  id = result.sandbox_id;
  assert.match(id, /^[a-zA-Z0-9-]+$/); assert.match(result.template_reference, /^localhost:5000\/abx-project:native-project-/);
  const probe = await invoke(["--provider", "opensandbox", "exec", id, "python3 -c \"import urllib.request; print(urllib.request.urlopen('http://127.0.0.1:9000').read().decode())\""]);
  assert.ok(probe.includes("project-ready"));
  console.log("PASS native Docker build/push -> provider image reference -> real OpenSandbox create -> service startup/readiness -> exec probe");
} finally {
  if (id) await invoke(["--provider", "opensandbox", "kill", id, "--yes"]);
  await fs.rm(work, { recursive: true, force: true });
}
