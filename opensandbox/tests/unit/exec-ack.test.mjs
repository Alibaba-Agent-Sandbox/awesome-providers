import test from "node:test";
import assert from "node:assert/strict";
import { methods } from "../../src/exec.mjs";

for (const events of [[], [{ type: "stdout", text: "started" }], [{ type: "init", text: "" }]]) {
  test(`exec.start refuses a missing native acknowledgment (${JSON.stringify(events)})`, async () => {
    let requests = 0, released = false, subscribed = false, response;
    const ctx = {
      osb: { execd: async () => {
        requests++;
        response = new Response(events.map(event => JSON.stringify(event) + "\n\n").join(""));
        return { response, release() { released = true; } };
      } },
      afterResponse() { subscribed = true; },
    };
    await assert.rejects(methods["exec.start"]({ sandbox_id: "owned", cmd: "server", timeout: 1 }, ctx), error => {
      assert.equal(error.code, -32000);
      assert.equal(error.data.retryable, false);
      return /native process identifier/.test(error.message);
    });
    assert.equal(requests, 1);
    assert.equal(released, true);
    assert.equal(response.body.locked, false);
    assert.equal(subscribed, false);
  });
}
