// A small in-memory OpenSandbox that reproduces the quirks the plugin has to handle
// (see docs/en/design/provider-opensandbox-mapping.md). Lifecycle API and per-sandbox "execd" live
// on one HTTP server; each sandbox's files are a real temp directory and commands run as local processes.
//
// Options: { apiKey, legacyExecd, gateway, onRequest }
//   legacyExecd  execd < the line-preserving build: no `argv`, one stdout event per line without terminator
//   gateway      resolve endpoints with required headers (the data plane rejects requests without them)

import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, readFileSync, writeFileSync, statSync, readdirSync, renameSync, existsSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve, sep } from "node:path";
import { randomUUID, randomBytes, createHash } from "node:crypto";

const LABEL = /^[A-Za-z0-9]([-A-Za-z0-9_.]*[A-Za-z0-9])?$/;
const send = (res, status, body, headers = {}) => {
  const text = body === undefined ? "" : typeof body === "string" ? body : JSON.stringify(body);
  res.writeHead(status, { "Content-Type": typeof body === "string" ? "text/plain" : "application/json", ...headers });
  res.end(text);
};
const readBody = (req) => new Promise((resolveBody) => {
  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", () => resolveBody(Buffer.concat(chunks)));
});

function parseMultipart(buf, contentType) {
  const boundary = /boundary=(.+)$/.exec(contentType ?? "")?.[1];
  if (!boundary) return [];
  const delim = Buffer.from(`--${boundary}`);
  const parts = [];
  let pos = buf.indexOf(delim);
  while (pos >= 0) {
    const next = buf.indexOf(delim, pos + delim.length);
    if (next < 0) break;
    const chunk = buf.subarray(pos + delim.length + 2, next - 2);
    const split = chunk.indexOf("\r\n\r\n");
    const head = chunk.subarray(0, split).toString();
    parts.push({
      name: /name="([^"]*)"/.exec(head)?.[1],
      filename: /filename="([^"]*)"/.exec(head)?.[1],
      data: chunk.subarray(split + 4),
    });
    pos = next;
  }
  return parts;
}

export async function startMock(options = {}) {
  const { apiKey = "mock-key", legacyExecd = false, gateway = false, onRequest } = options;
  const sandboxes = new Map();
  const commands = new Map();
  const pty = { resizes: [], stdin: [], deleted: [], sockets: 0 };
  const upgraded = new Set();
  let origin = "";

  const fsPath = (sb, p) => {
    if (p.startsWith("/tmp/.abx-stdin-")) return p; // the plugin's stdin spool is read through an absolute path
    const full = resolve(sb.root, `.${p.startsWith("/") ? p : `/${p}`}`);
    if (full !== sb.root && !full.startsWith(sb.root + sep)) throw new Error("path escapes sandbox");
    return full;
  };
  const view = (sb) => ({
    id: sb.id,
    image: { uri: sb.image },
    status: { state: sb.state, message: `mock ${sb.state}` },
    metadata: sb.metadata,
    entrypoint: sb.entrypoint,
    expiresAt: sb.expiresAt,
    createdAt: sb.createdAt,
  });
  const fileInfo = (sb, p) => {
    const st = statSync(fsPath(sb, p), { throwIfNoEntry: false });
    if (!st) return undefined;
    return {
      path: p,
      type: st.isDirectory() ? "directory" : "file",
      size: st.size,
      modified_at: st.mtime.toISOString(),
      created_at: st.ctime.toISOString(),
      owner: "root",
      group: "root",
      mode: Number.parseInt((st.mode & 0o777).toString(8), 10),
    };
  };
  const walk = (dir, depth, max, out = []) => {
    for (const name of readdirSync(dir).sort()) {
      const full = join(dir, name);
      out.push(full);
      if (statSync(full).isDirectory() && depth < max) walk(full, depth + 1, max, out);
    }
    return out;
  };

  // ------------------------------------------------------------------ execd
  async function execd(req, res, sb, path, query) {
    if (gateway && req.headers["x-gw-route"] !== "1") return send(res, 401, { error: "Unauthorized: invalid or missing header X-GW-ROUTE" });
    const method = req.method;
    if (path === "/ping") return send(res, 200);
    if (path === "/pty" && method === "POST") {
      const sessionId = randomUUID();
      sb.ptys.set(sessionId, { opened: false });
      return send(res, 201, { session_id: sessionId });
    }
    const ptyDelete = /^\/pty\/([^/]+)$/.exec(path);
    if (ptyDelete && method === "DELETE") {
      pty.deleted.push(ptyDelete[1]);
      sb.ptys.delete(ptyDelete[1]);
      return send(res, 200);
    }
    if (path === "/command" && method === "POST") {
      const body = JSON.parse((await readBody(req)).toString());
      if (legacyExecd && body.argv) {
        return send(res, 400, { code: "INVALID_REQUEST_BODY", message: "Key: 'RunCommandRequest.Command' Error:Field validation for 'Command' failed on the 'required' tag" });
      }
      const argv = body.argv ?? ["sh", "-c", body.command];
      const id = randomBytes(16).toString("hex");
      res.writeHead(200, { "Content-Type": "text/event-stream" });
      const emit = (ev) => res.write(`${JSON.stringify(ev)}\n\n`);
      emit({ type: "init", text: id, timestamp: Date.now() });
      const record = { log: "", running: true, exit: undefined };
      commands.set(id, record);
      const cwd = body.cwd ? fsPath(sb, body.cwd) : sb.root;
      mkdirSync(cwd, { recursive: true });
      let child;
      try {
        child = spawn(argv[0], argv.slice(1), { cwd, env: { PATH: process.env.PATH, HOME: sb.root, ...sb.env, ...(body.envs ?? {}) }, detached: true });
      } catch (err) {
        emit({ type: "error", error: { ename: "CommandExecError", evalue: String(err.message), traceback: [] } });
        return res.end();
      }
      let startFailed = false;
      child.on("error", (err) => {
        startFailed = true;
        emit({ type: "error", error: { ename: "CommandExecError", evalue: `exec: "${argv[0]}": executable file not found in $PATH (${err.code})`, traceback: [] } });
        record.running = false;
        res.end();
      });
      const pump = (stream, type) => {
        let carry = "";
        stream.on("data", (chunk) => {
          record.log += chunk;
          const text = carry + chunk.toString();
          if (!legacyExecd) return emit({ type, text, timestamp: Date.now() });
          const lines = text.split("\n");
          carry = lines.pop();
          for (const line of lines) emit({ type, text: line.replace(/\r$/, ""), timestamp: Date.now() });
        });
        stream.on("end", () => { if (legacyExecd && carry) emit({ type, text: carry }); });
      };
      pump(child.stdout, "stdout");
      pump(child.stderr, "stderr");
      let timedOut = false;
      const timer = body.timeout ? setTimeout(() => { timedOut = true; try { process.kill(-child.pid, "SIGKILL"); } catch { /* gone */ } }, body.timeout) : undefined;
      req.on("close", () => { if (!body.background && record.running) try { process.kill(-child.pid, "SIGKILL"); } catch { /* gone */ } });
      record.child = child;
      if (body.background) {
        emit({ type: "execution_complete", execution_time: 1 });
        res.end();
      }
      child.on("close", (code, signal) => {
        clearTimeout(timer);
        if (startFailed) return;
        record.running = false;
        record.exit = code ?? 137;
        if (body.background) return;
        if (timedOut || signal) emit({ type: "error", error: { ename: "CommandExecError", evalue: "-1", traceback: ["signal: killed"] } });
        else if (code !== 0) emit({ type: "error", error: { ename: "CommandExecError", evalue: String(code), traceback: [`exit status ${code}`] } });
        else emit({ type: "execution_complete", execution_time: 1 });
        res.end();
      });
      return undefined;
    }
    let m = /^\/command\/status\/(.+)$/.exec(path);
    if (m) {
      const rec = commands.get(m[1]);
      if (!rec) return send(res, 404, { code: "INVALID_REQUEST_BODY", message: `command not found: ${m[1]}` });
      return send(res, 200, { id: m[1], content: "", running: rec.running, exit_code: rec.exit });
    }
    m = /^\/command\/([^/]+)\/logs$/.exec(path);
    if (m) {
      const rec = commands.get(m[1]);
      if (!rec) return send(res, 404, { code: "INVALID_REQUEST_BODY", message: "command not found" });
      const cursor = Number(query.get("cursor") ?? 0);
      return send(res, 200, rec.log.slice(cursor), { "EXECD-COMMANDS-TAIL-CURSOR": String(rec.log.length) });
    }
    if (path === "/command" && method === "DELETE") {
      const rec = commands.get(query.get("id"));
      if (rec?.child) try { process.kill(-rec.child.pid, "SIGKILL"); } catch { /* gone */ }
      return send(res, 200);
    }
    if (path === "/files/info" && method === "GET") {
      const out = {};
      for (const p of query.getAll("path")) {
        const info = fileInfo(sb, p);
        if (!info) return send(res, 404, { code: "FILE_NOT_FOUND", message: `file not found: ${p}` });
        out[p] = info;
      }
      return send(res, 200, out);
    }
    if (path === "/files/download" && method === "GET") {
      const full = fsPath(sb, query.get("path"));
      if (!existsSync(full)) return send(res, 404, { code: "FILE_NOT_FOUND", message: "file not found" });
      if (statSync(full).isDirectory()) return send(res, 200, "");
      let data = readFileSync(full);
      const range = /bytes=(\d+)-(\d*)/.exec(req.headers.range ?? "");
      if (range) {
        data = data.subarray(Number(range[1]), range[2] ? Number(range[2]) + 1 : undefined);
        res.writeHead(206, { "Content-Type": "application/octet-stream" });
        return res.end(data);
      }
      res.writeHead(200, { "Content-Type": "application/octet-stream" });
      return res.end(data);
    }
    if (path === "/files/upload" && method === "POST") {
      const parts = parseMultipart(await readBody(req), req.headers["content-type"]);
      const meta = parts.find((p) => p.name === "metadata");
      const file = parts.find((p) => p.name === "file");
      if (!meta?.filename) return send(res, 400, { code: "INVALID_REQUEST_BODY", message: "metadata file is missing" });
      const info = JSON.parse(meta.data.toString());
      const full = fsPath(sb, info.path);
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, file.data);
      if (info.mode) chmodSync(full, Number.parseInt(String(info.mode), 8));
      return send(res, 200);
    }
    if (path === "/files" && method === "DELETE") {
      const full = fsPath(sb, query.get("path"));
      if (existsSync(full) && statSync(full).isDirectory()) return send(res, 500, { code: "RUNTIME_ERROR", message: "path is a directory" });
      rmSync(full, { force: true });
      return send(res, 200);
    }
    if (path === "/files/mv" && method === "POST") {
      for (const { src, dest } of JSON.parse((await readBody(req)).toString())) {
        if (!existsSync(fsPath(sb, src))) return send(res, 404, { code: "FILE_NOT_FOUND", message: "source not found" });
        if (existsSync(fsPath(sb, dest))) return send(res, 500, { code: "RUNTIME_ERROR", message: "destination path already exists" });
        mkdirSync(dirname(fsPath(sb, dest)), { recursive: true });
        renameSync(fsPath(sb, src), fsPath(sb, dest));
      }
      return send(res, 200);
    }
    if (path === "/files/permissions" && method === "POST") {
      for (const [p, spec] of Object.entries(JSON.parse((await readBody(req)).toString()))) chmodSync(fsPath(sb, p), Number.parseInt(String(spec.mode), 8));
      return send(res, 200);
    }
    if (path === "/files/search" && method === "GET") {
      const rootDir = fsPath(sb, query.get("path"));
      const pattern = query.get("pattern") ?? "**";
      const re = new RegExp(`^${pattern.replace(/\*\*\/|\*\*|\*|[.+^${}()|[\]\\]/g, (t) => ({ "**/": "(?:.*/)?", "**": ".*", "*": "[^/]*" })[t] ?? `\\${t}`)}$`);
      const found = walk(rootDir, 1, 99).filter((f) => re.test(f.slice(rootDir.length + 1)));
      return send(res, 200, found.map((f) => fileInfo(sb, f.slice(sb.root.length))));
    }
    if (path === "/directories/list" && method === "GET") {
      const full = fsPath(sb, query.get("path"));
      if (!existsSync(full)) return send(res, 404, { code: "FILE_NOT_FOUND", message: "directory not found" });
      if (!statSync(full).isDirectory()) return send(res, 400, { code: "INVALID_REQUEST", message: "not a directory" });
      return send(res, 200, walk(full, 1, Number(query.get("depth") ?? 1)).map((f) => fileInfo(sb, f.slice(sb.root.length))));
    }
    if (path === "/directories" && method === "POST") {
      for (const p of Object.keys(JSON.parse((await readBody(req)).toString()))) mkdirSync(fsPath(sb, p), { recursive: true });
      return send(res, 200);
    }
    if (path === "/directories" && method === "DELETE") {
      const full = fsPath(sb, query.get("path"));
      if (!existsSync(full)) return send(res, 404, { code: "FILE_NOT_FOUND", message: "directory not found" });
      rmSync(full, { recursive: true, force: true });
      return send(res, 200);
    }
    return send(res, 404, { code: "NOT_FOUND", message: `no route ${method} ${path}` });
  }

  // ------------------------------------------------------------------ lifecycle
  async function lifecycle(req, res, path, query) {
    if (req.headers["open-sandbox-api-key"] === undefined) return send(res, 401, { code: "MISSING_API_KEY", message: "Missing API key" });
    if (req.headers["open-sandbox-api-key"] !== apiKey) return send(res, 401, { code: "INVALID_API_KEY", message: "Invalid API key" });
    const method = req.method;
    if (path === "/sandboxes" && method === "POST") {
      const body = JSON.parse((await readBody(req)).toString());
      const errors = [];
      if (!body.entrypoint) errors.push({ type: "value_error", loc: ["body", "entrypoint"], msg: "Entrypoint is required when image is provided." });
      if (!body.resourceLimits) errors.push({ type: "missing", loc: ["body", "resourceLimits"], msg: "Field required" });
      if (body.timeout !== undefined && body.timeout < 60) errors.push({ type: "greater_than_equal", loc: ["body", "timeout"], msg: "Input should be greater than or equal to 60" });
      if (errors.length) return send(res, 422, { detail: errors });
      for (const [k, v] of Object.entries(body.metadata ?? {})) {
        if (!LABEL.test(k) || (v !== "" && !LABEL.test(v)) || v.length > 63) return send(res, 400, { code: "SANDBOX::INVALID_METADATA_LABEL", message: `Invalid metadata ${k}` });
      }
      if (body.image.uri.includes("missing-image")) return send(res, 500, { code: "DOCKER::SANDBOX_IMAGE_PULL_FAILED", message: "pull access denied" });
      if (body.secureAccess) return send(res, 400, { code: "SANDBOX::SECURE_ACCESS_UNSUPPORTED", message: "secureAccess needs the gateway" });
      const id = randomUUID();
      const root = mkdtempSync(join(tmpdir(), "mock-osb-"));
      const sb = {
        id, root, image: body.image.uri, state: "Running", metadata: body.metadata ?? {}, env: body.env ?? {}, entrypoint: body.entrypoint,
        ptys: new Map(), createdAt: new Date().toISOString(), expiresAt: body.timeout ? new Date(Date.now() + body.timeout * 1000).toISOString() : undefined, request: body,
      };
      sandboxes.set(id, sb);
      return send(res, 202, { id, status: { state: "Running" }, metadata: sb.metadata, expiresAt: sb.expiresAt, createdAt: sb.createdAt, entrypoint: sb.entrypoint });
    }
    if (path === "/sandboxes" && method === "GET") {
      const page = Number(query.get("page") ?? 1);
      const size = Number(query.get("pageSize") ?? 20);
      const states = query.getAll("state");
      const meta = Object.fromEntries(new URLSearchParams(query.get("metadata") ?? ""));
      const all = [...sandboxes.values()].filter((sb) => (!states.length || states.includes(sb.state)) && Object.entries(meta).every(([k, v]) => sb.metadata[k] === v));
      const items = all.slice((page - 1) * size, page * size).map(view);
      return send(res, 200, { items, pagination: { page, pageSize: size, totalItems: all.length, totalPages: Math.ceil(all.length / size), hasNextPage: page * size < all.length } });
    }
    const m = /^\/sandboxes\/([^/]+)(?:\/(.+))?$/.exec(path);
    if (!m) return send(res, 404, { code: "NOT_FOUND", message: "no route" });
    const sb = sandboxes.get(m[1]);
    if (!sb) return send(res, 404, { code: "DOCKER::SANDBOX_NOT_FOUND", message: `Sandbox ${m[1]} not found` });
    const sub = m[2];
    if (!sub && method === "GET") return send(res, 200, view(sb));
    if (!sub && method === "DELETE") {
      sandboxes.delete(sb.id);
      rmSync(sb.root, { recursive: true, force: true });
      return send(res, 204);
    }
    if (sub === "renew-expiration" && method === "POST") {
      sb.expiresAt = JSON.parse((await readBody(req)).toString()).expiresAt;
      return send(res, 200, { expiresAt: sb.expiresAt });
    }
    if (sub === "pause" || sub === "resume") {
      if ((sub === "pause") === (sb.state === "Paused")) return send(res, 409, { code: "DOCKER::INVALID_STATE", message: `Sandbox is ${sb.state}` });
      sb.state = sub === "pause" ? "Paused" : "Running";
      return send(res, 202);
    }
    const ep = /^endpoints\/(\d+)$/.exec(sub ?? "");
    if (ep) {
      const proxied = query.get("use_server_proxy") === "true";
      const base = proxied ? `${origin.replace("http://", "")}/v1/sandboxes/${sb.id}/proxy/${ep[1]}` : ep[1] === "44772" ? `${origin.replace("http://", "")}/execd/${sb.id}` : `${origin.replace("http://", "")}/execd/${sb.id}/proxy/${ep[1]}`;
      return send(res, 200, { endpoint: base, ...(gateway ? { headers: { "X-GW-Route": "1" } } : {}) });
    }
    return send(res, 404, { code: "NOT_FOUND", message: "no route" });
  }

  /** Just enough RFC 6455 for the terminal: handshake, masked client frames in, plain frames out. */
  function upgrade(req, socket) {
    const url = new URL(req.url, "http://x");
    const m = /^(?:\/execd\/([^/]+)|\/v1\/sandboxes\/([^/]+)\/proxy\/44772)\/pty\/([^/]+)\/ws$/.exec(url.pathname);
    const sb = m && sandboxes.get(m[1] ?? m[2]);
    if (!sb || !sb.ptys.has(m[3]) || (gateway && req.headers["x-gw-route"] !== "1")) {
      socket.end("HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n");
      return;
    }
    const accept = createHash("sha1").update(`${req.headers["sec-websocket-key"]}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`).digest("base64");
    socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);
    pty.sockets += 1;
    upgraded.add(socket);
    socket.on("close", () => upgraded.delete(socket));
    const out = (opcode, payload) => {
      const head = payload.length < 126 ? Buffer.from([0x80 | opcode, payload.length]) : Buffer.from([0x80 | opcode, 126, payload.length >> 8, payload.length & 255]);
      socket.write(Buffer.concat([head, payload]));
    };
    out(1, Buffer.from(JSON.stringify({ type: "connected", session_id: m[3], mode: "pty", role: "holder" })));
    let buf = Buffer.alloc(0);
    socket.on("data", (chunk) => {
      buf = Buffer.concat([buf, chunk]);
      for (;;) {
        if (buf.length < 2) return;
        const opcode = buf[0] & 15;
        let len = buf[1] & 127;
        let at = 2;
        if (len === 126) {
          if (buf.length < 4) return;
          len = buf.readUInt16BE(2);
          at = 4;
        }
        if (buf.length < at + 4 + len) return;
        const mask = buf.subarray(at, at + 4);
        const data = Buffer.from(buf.subarray(at + 4, at + 4 + len));
        for (let i = 0; i < data.length; i += 1) data[i] ^= mask[i % 4];
        buf = buf.subarray(at + 4 + len);
        if (opcode === 8) {
          socket.end();
          return;
        }
        if (opcode === 1) {
          const msg = JSON.parse(data.toString());
          if (msg.type === "resize") pty.resizes.push([msg.cols, msg.rows]);
        } else if (opcode === 2 && data[0] === 0) {
          pty.stdin.push(data.subarray(1).toString());
          out(2, Buffer.concat([Buffer.from([1]), Buffer.from(`echo:${data.subarray(1).toString()}`)]));
          if (data.subarray(1).toString().includes("exit")) out(1, Buffer.from(JSON.stringify({ type: "exit" })));
        }
      }
    });
    socket.on("error", () => undefined);
  }

  const server = createServer(async (req, res) => {
    const url = new URL(req.url, "http://x");
    onRequest?.(req);
    try {
      const m = /^\/execd\/([^/]+)(\/.*)?$/.exec(url.pathname);
      if (m) {
        const sb = sandboxes.get(m[1]);
        if (!sb) return send(res, 502, "bad gateway: sandbox gone");
        if (sb.state === "Paused") return req.socket.destroy();
        return await execd(req, res, sb, m[2] ?? "/", url.searchParams);
      }
      const proxy = /^\/v1\/sandboxes\/([^/]+)\/proxy\/(\d+)(\/.*)?$/.exec(url.pathname);
      if (proxy) {
        const sb = sandboxes.get(proxy[1]);
        if (!sb) return send(res, 404, { code: "DOCKER::SANDBOX_NOT_FOUND", message: "gone" });
        return proxy[2] === "44772" ? await execd(req, res, sb, proxy[3] ?? "/", url.searchParams) : send(res, 200, "proxied");
      }
      const path = url.pathname.replace(/^\/v1(?=\/)/, "");
      return await lifecycle(req, res, path, url.searchParams);
    } catch (err) {
      return send(res, 500, { code: "MOCK_ERROR", message: String(err?.stack ?? err) });
    }
  });
  server.on("upgrade", (req, socket) => upgrade(req, socket));
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  origin = `http://127.0.0.1:${server.address().port}`;
  return {
    origin,
    apiKey,
    sandboxes,
    pty,
    async close() {
      for (const sb of sandboxes.values()) rmSync(sb.root, { recursive: true, force: true });
      for (const socket of upgraded) socket.destroy();
      server.closeAllConnections?.();
      await new Promise((r) => server.close(r));
    },
  };
}
