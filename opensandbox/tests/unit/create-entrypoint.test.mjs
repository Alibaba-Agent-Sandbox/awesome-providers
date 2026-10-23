import test from "node:test";
import assert from "node:assert/strict";
import { parseConfig, DEFAULT_ENTRYPOINT } from "../../src/config.mjs";
import { buildCreateBody } from "../../src/sandbox.mjs";

test("a stock image stays alive when the caller omits entrypoint", () => {
  // The host delivers the manifest default, so both shapes must keep python:3.12-slim running.
  for (const cfg of [parseConfig({}), parseConfig({ entrypoint: "tail -f /dev/null" })]) {
    const { body } = buildCreateBody({ template: "base" }, cfg);
    assert.deepEqual(body.entrypoint, ["tail", "-f", "/dev/null"]);
    assert.deepEqual(body.entrypoint, DEFAULT_ENTRYPOINT);
    assert.equal(body.image.uri, "python:3.12-slim");
    assert.equal(JSON.stringify(body).includes("aliyuncs"), false);
  }
});

test("an explicit entrypoint from the caller wins", () => {
  const configured = parseConfig({ entrypoint: "python3 commands.py" });
  assert.deepEqual(buildCreateBody({ template: "base" }, configured).body.entrypoint, ["python3", "commands.py"]);
  assert.deepEqual(buildCreateBody({ template: "ubuntu:22.04" }, parseConfig({ entrypoint: "sleep infinity" })).body.entrypoint, ["sleep", "infinity"]);

  const { body } = buildCreateBody({ template: "base", options: { entrypoint: "sleep 30" } }, parseConfig({}));
  assert.deepEqual(body.entrypoint, ["sleep", "30"]);
});

test("image names never override the configured platform keepalive", () => {
  for (const config of [{}, { entrypoint: "tail -f /dev/null" }]) {
    assert.deepEqual(buildCreateBody({ template: "code" }, parseConfig(config)).body.entrypoint, DEFAULT_ENTRYPOINT);
  }
  assert.deepEqual(buildCreateBody({ template: "code" }, parseConfig({ entrypoint: "/opt/code-interpreter/code-interpreter.sh" })).body.entrypoint,
    ["/opt/code-interpreter/code-interpreter.sh"]);
});
