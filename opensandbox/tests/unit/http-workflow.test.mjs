import test from "node:test";
import assert from "node:assert/strict";
import { OsbClient } from "../../src/http.mjs";
import { parseConfig } from "../../src/config.mjs";

const response = value => new Response(JSON.stringify(value), { headers: { "content-type": "application/json" } });

test("provider endpoint keeps proxy prefix and signed query and disables redirect", async () => {
  const seen = [];
  const client = new OsbClient(parseConfig({}), { fetchImpl: async (url, init) => {
    seen.push({ url, init });
    if (String(url).includes("/endpoints/")) return response({ endpoint: "https://gateway.invalid/proxy/sandbox-a/44771?ticket=opaque", headers: { "X-Gateway-Token": "bound-gateway" } });
    return response({ ok: true });
  } });
  await client.execdJson("sandbox-a", "GET", "/ping");
  assert.equal(seen[1].url, "https://gateway.invalid/proxy/sandbox-a/44771/ping?ticket=opaque");
  assert.equal(seen[1].init.headers["X-Gateway-Token"], "bound-gateway");
  assert.ok(seen.every(item => item.init.redirect === "error"));
});

test("userinfo and operation-signed endpoints fail before a data-plane request", async () => {
  for (const endpoint of [{ endpoint: "https://user:pass@gateway.invalid/proxy/a" }, { endpoint: "https://gateway.invalid/proxy/a?signature=bound", path_mode: "operation-signed" }]) {
    let calls = 0;
    const client = new OsbClient(parseConfig({}), { fetchImpl: async () => { calls++; return response(endpoint); } });
    await assert.rejects(client.execdJson("sandbox-a", "POST", "/command", { body: { command: "sensitive-payload" }, idempotent: false }));
    assert.equal(calls, 1);
  }
});

test("non-idempotent request is never replayed after an unknown network response", async () => {
  let dataCalls = 0;
  const client = new OsbClient(parseConfig({}), { fetchImpl: async (url) => {
    if (String(url).includes("/endpoints/")) return response({ endpoint: "http://gateway.invalid/proxy/a" });
    dataCalls++;
    throw new Error("network response unavailable");
  } });
  await assert.rejects(client.execdJson("sandbox-a", "POST", "/command", { body: { command: "non-idempotent" }, idempotent: false }));
  assert.equal(dataCalls, 1);
});
