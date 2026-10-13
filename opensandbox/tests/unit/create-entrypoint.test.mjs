import test from "node:test";
import assert from "node:assert/strict";
import { parseConfig, CODE_INTERPRETER_ENTRYPOINT, DEFAULT_ENTRYPOINT } from "../../src/config.mjs";
import { buildCreateBody } from "../../src/sandbox.mjs";

test("create starts commands.py when the caller omits entrypoint", () => {
  const cfg = parseConfig({});
  assert.equal(cfg.entrypoint, undefined);
  const { body } = buildCreateBody({ template: "base" }, cfg);
  assert.deepEqual(body.entrypoint, ["python3", "commands.py"]);
  assert.deepEqual(body.entrypoint, DEFAULT_ENTRYPOINT);
  assert.equal(body.image.uri, "python:3.12-slim");
  assert.equal(JSON.stringify(body).includes("aliyuncs"), false);
});

test("an explicit entrypoint from the caller wins", () => {
  const configured = parseConfig({ entrypoint: "sleep infinity" });
  assert.deepEqual(buildCreateBody({ template: "ubuntu:22.04" }, configured).body.entrypoint, ["sleep", "infinity"]);

  const { body } = buildCreateBody({ template: "base", options: { entrypoint: "sleep 30" } }, parseConfig({}));
  assert.deepEqual(body.entrypoint, ["sleep", "30"]);
});

test("code interpreter image keeps its runtime entrypoint when none is passed", () => {
  const { body } = buildCreateBody({ template: "code" }, parseConfig({}));
  assert.deepEqual(body.entrypoint, CODE_INTERPRETER_ENTRYPOINT);
  assert.equal(body.image.uri, "opensandbox/code-interpreter:v1.1.0");
});
