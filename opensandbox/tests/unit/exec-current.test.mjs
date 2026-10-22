import assert from "node:assert/strict";
import test from "node:test";
import { methods } from "../../src/exec.mjs";

test("an unsupported argv request fails once without replaying a string command", async () => {
  const rejection = Object.assign(new Error("unsupported argv"), { httpStatus: 400, rawMessage: "argv 'Command'" });
  const calls = [];
  const ctx = { osb: { execd: async (...args) => { calls.push(args); throw rejection; } } };
  await assert.rejects(methods["exec.run"]({ sandbox_id: "owned", cmd: "printf", args: ["a b"] }, ctx), error => error === rejection);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0][3].body, { argv: ["printf", "a b"] });
});
