import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createPlugin } from "../opensandbox/provider.mjs";
import createCube from "../cubesandbox/provider.mjs";
import createContainer from "../alicloud-container/provider.mjs";

class Unsupported extends Error {}
class Protocol {}
const kit = (calls) => ({
  errors: { ProviderFeatureNotSupportedError: Unsupported }, FilesystemProtocol: Protocol, ProcessProtocol: Protocol, SandboxProtocol: Protocol,
  headerKeyAuth: () => ({}), noAuth: () => ({}),
  e2b: { resumeConnect: value => value, overlay: (value, extra) => Object.assign(value, extra), withDefault: value => value, parseExecution: () => ({ stdout: "42" }) },
});

for (const [name, create] of [["cubesandbox", createCube], ["alicloud-container", createContainer]]) {
  test(`${name} refuses contexts and callbacks before sending interpreter payload`, async () => {
    const calls = [];
    const ctx = { options: { domain: "example.invalid", api_key: "fixture" }, headerKeyAuth: () => ({}), noAuth: () => ({}), http: () => ({ envdHttpRequest: async (...args) => { calls.push(args); return { text: "{}" }; } }) };
    const infra = await create(kit(calls)).buildInfra(ctx);
    assert.equal(infra.operation_contract_version, 1);
    assert.ok(infra.operations.cli.includes("code.default-context.execute"));
    assert.ok(!infra.operations.cli.includes("code.execute"));
    assert.ok(!infra.operations.python.includes("template.prepare"));
    for (const extra of [{ context_id: "context-id" }, { on_stdout() {} }, { on_result() {} }]) {
      await assert.rejects(infra.code_interpreter_protocol.runCode("a", "https://49983-a.example.invalid", null, { code: "raise Exception()", ...extra }), Unsupported);
    }
    assert.equal(calls.length, 0);
  });
}

test("OpenSandbox handshake declares the exact per-consumer operation boundary", async () => {
  const result = await createPlugin().dispatch("initialize", { protocol: "epp/1", config: {} }, {});
  assert.equal(result.operation_contract_version, 1);
  assert.ok(result.operations.cli.includes("template.prepare"));
  assert.ok(!result.operations.python.includes("template.prepare"));
  assert.ok(!result.operations.cli.some(operation => operation.startsWith("code.")));
  assert.ok(!result.startup_modes.includes("entrypoint"));
});

test("all plugin manifests and runtime declarations use identical operation lists", async () => {
  for (const name of ["opensandbox", "e2b", "cubesandbox", "alicloud-container"]) {
    const manifest = await fs.readFile(new URL(`../${name}/abx-provider.toml`, import.meta.url), "utf8");
    const { OPERATIONS, WORKFLOW_INPUTS, STARTUP_MODES } = await import(`../${name}/operations.mjs`);
    for (const consumer of ["cli", "python"]) {
      const line = manifest.split("\n").find(value => value.startsWith(`${consumer} = `));
      assert.deepEqual(JSON.parse(line.split(" = ")[1]), OPERATIONS[consumer]);
    }
    assert.deepEqual(JSON.parse(manifest.split("\n").find(value => value.startsWith("inputs = ")).split(" = ")[1]), WORKFLOW_INPUTS);
    assert.deepEqual(JSON.parse(manifest.split("\n").find(value => value.startsWith("startups = ")).split(" = ")[1]), STARTUP_MODES);
  }
});
