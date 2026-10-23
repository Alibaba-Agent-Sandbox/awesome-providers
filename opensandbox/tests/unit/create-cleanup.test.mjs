import test from "node:test";
import assert from "node:assert/strict";
import { methods } from "../../src/sandbox.mjs";
import { parseConfig } from "../../src/config.mjs";
import { RpcError, CODES } from "../../src/errors.mjs";

function fixture({ failAt, cleanupError, abort = false } = {}) {
  const controller = new AbortController();
  const original = new RpcError(CODES.TIMEOUT, "original failure", { cancelled: abort });
  const calls = [], logs = [], forgotten = [];
  let reads = 0;
  const ctx = {
    cfg: parseConfig({}), signal: controller.signal, log: value => logs.push(value),
    osb: {
      async lifecycle(method, path, options) {
        calls.push({ method, path, options });
        if (method === "POST") return { json: { id: "owned/id" } };
        if (method === "DELETE") {
          assert.equal(options.signal, undefined, "cleanup must not inherit cancellation");
          if (cleanupError) throw cleanupError;
          return {};
        }
        reads++;
        if (failAt === reads) {
          if (abort) controller.abort();
          throw original;
        }
        return { json: { id: "owned/id", status: { state: "Running" } } };
      },
      async execd() {},
      forget(id) { forgotten.push(id); },
    },
  };
  return { ctx, original, calls, logs, forgotten };
}

for (const [name, options] of [
  ["readiness failure", { failAt: 1 }],
  ["final detail read failure", { failAt: 2 }],
  ["cancelled final detail read", { failAt: 2, abort: true }],
]) {
  test(`create cleans its known sandbox on ${name}`, async () => {
    const f = fixture(options);
    await assert.rejects(methods["sandbox.create"]({ template: "base" }, f.ctx), error => error === f.original);
    assert.equal(f.calls.filter(call => call.method === "DELETE").length, 1);
    assert.equal(f.calls.at(-1).path, "/sandboxes/owned%2Fid");
    assert.deepEqual(f.forgotten, ["owned/id"]);
    assert.equal(f.logs.length, 0);
  });
}

test("failed cleanup preserves original error and supplies recovery ID without backend details", async () => {
  const f = fixture({ failAt: 2, cleanupError: new Error("private-key-from-backend") });
  await assert.rejects(methods["sandbox.create"]({ template: "base" }, f.ctx), error => error === f.original);
  assert.equal(f.original.code, CODES.TIMEOUT);
  assert.deepEqual(f.original.data.cleanup, { sandbox_id: "owned/id", status: "failed" });
  assert.equal(f.logs.length, 1);
  assert.ok(f.logs[0].includes("owned/id"));
  assert.equal(JSON.stringify([f.logs, f.original.data]).includes("private-key-from-backend"), false);
});

test("cleanup of an already removed sandbox is successful", async () => {
  const f = fixture({ failAt: 2, cleanupError: new RpcError(CODES.NOT_FOUND, "gone") });
  await assert.rejects(methods["sandbox.create"]({ template: "base" }, f.ctx), error => error === f.original);
  assert.equal(f.original.data.cleanup, undefined);
  assert.equal(f.logs.length, 0);
});

test("successful create returns the final record and retains the sandbox", async () => {
  const f = fixture();
  const result = await methods["sandbox.create"]({ template: "base" }, f.ctx);
  assert.equal(result.sandbox_id, "owned/id");
  assert.equal(f.calls.filter(call => call.method === "DELETE").length, 0);
  assert.deepEqual(f.forgotten, []);
});
