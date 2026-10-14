// pty.* methods: an interactive terminal on execd (`POST /pty`, then WebSocket `/pty/{id}/ws`).
// Client frames: 0x00 + bytes is stdin, a JSON text frame `{type:"resize",cols,rows}` resizes.
// Server frames: 0x01/0x02 + bytes is output, 0x03 + 8 bytes + bytes is replayed output, `{type:"exit"}` ends it.

import { randomUUID } from "node:crypto";
import { badParams, failure, notFound } from "./errors.mjs";
import { sandboxId } from "./sandbox.mjs";
import { EXECD_PORT } from "./convert.mjs";

/** The global WebSocket client arrived in Node 22. Without it the plugin does not offer `pty`. */
export const hasWebSocket = () => typeof globalThis.WebSocket === "function";

const OPEN_TIMEOUT_MS = 15_000;

function socketFor(url, headers) {
  const ws = new globalThis.WebSocket(url, { headers });
  ws.binaryType = "arraybuffer";
  return ws;
}

const toBuffer = (data) => (typeof data === "string" ? Buffer.from(data, "utf8") : Buffer.from(data));

export function attach(ctx, ptyId, ws, cleanup) {
  let ended = false;
  const end = () => {
    if (ended) return;
    ended = true;
    ctx.state.ptys.delete(ptyId);
    ctx.notify("pty.exit", { process_id: ptyId });
    cleanup();
  };
  ws.onmessage = (event) => {
    if (typeof event.data === "string") {
      if (!event.data) return;
      try {
        const payload = JSON.parse(event.data);
        if (payload?.type === "exit") return end();
        if (payload?.type === "connected") return;
      } catch {
        /* plain text is output */
      }
      ctx.notify("pty.output", { process_id: ptyId, data_b64: Buffer.from(event.data, "utf8").toString("base64") });
      return;
    }
    const frame = toBuffer(event.data);
    if (frame.length === 0) return;
    let payload;
    if (frame[0] === 1 || frame[0] === 2) payload = frame.subarray(1);
    else if (frame[0] === 3 && frame.length > 9) payload = frame.subarray(9);
    if (payload && payload.length > 0) ctx.notify("pty.output", { process_id: ptyId, data_b64: payload.toString("base64") });
  };
  ws.onclose = end;
  ws.onerror = end;
}

export const methods = {
  async "pty.open"(params, ctx) {
    const id = sandboxId(params);
    const created = await ctx.osb.execdJson(id, "POST", "/pty", { body: {}, idempotent: false, signal: ctx.signal, operation: "open terminal" });
    const execdSession = String(created?.session_id ?? "");
    if (!execdSession) throw failure("execd returned no terminal session.");
    const endpoint = await ctx.osb.endpoint(id, EXECD_PORT, { signal: ctx.signal });
    const url = `${endpoint.url.replace(/^http/, "ws")}/pty/${encodeURIComponent(execdSession)}/ws`;
    const ptyId = randomUUID();
    const ws = socketFor(url, endpoint.headers);
    const entry = { id, execdSession, ws };
    ctx.state.ptys.set(ptyId, entry);
    const deleteSession = () => {
      ctx.osb.execd(id, "DELETE", `/pty/${encodeURIComponent(execdSession)}`, { idempotent: false, operation: "close terminal" }).catch(() => undefined);
    };
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(failure("The terminal WebSocket did not open in time.")), OPEN_TIMEOUT_MS);
      ws.onopen = () => {
        clearTimeout(timer);
        resolve();
      };
      ws.onerror = () => {
        clearTimeout(timer);
        reject(failure("Could not open the terminal WebSocket to execd."));
      };
    }).catch((err) => {
      ctx.state.ptys.delete(ptyId);
      try {
        ws.close();
      } catch {
        /* already closed */
      }
      deleteSession();
      throw err;
    });
    attach(ctx, ptyId, ws, deleteSession);
    const cols = Number(params.cols) || 0;
    const rows = Number(params.rows) || 0;
    if (cols && rows) ws.send(JSON.stringify({ type: "resize", cols, rows }));
    return { process_id: ptyId };
  },

  async "pty.write"(params, ctx) {
    const { ws } = entryOf(params, ctx);
    const data = Buffer.from(String(params.data_b64 ?? ""), "base64");
    ws.send(Buffer.concat([Buffer.from([0]), data]));
    return {};
  },

  async "pty.resize"(params, ctx) {
    const { ws } = entryOf(params, ctx);
    const cols = Number(params.cols);
    const rows = Number(params.rows);
    if (!(cols > 0 && rows > 0)) throw badParams("cols and rows must be positive integers.");
    ws.send(JSON.stringify({ type: "resize", cols, rows }));
    return {};
  },

  async "pty.close"(params, ctx) {
    const id = String(params.process_id ?? "");
    const entry = ctx.state.ptys.get(id);
    if (!entry) return {};
    entry.ws.close();
    return {};
  },
};

function entryOf(params, ctx) {
  const id = String(params.process_id ?? "");
  const entry = ctx.state.ptys.get(id);
  if (!entry) throw notFound(`Terminal ${id} is not open.`);
  return entry;
}
