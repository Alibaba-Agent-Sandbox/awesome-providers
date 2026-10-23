/** Exact project operations; platform-native SDK support is a separate contract. */
export const OPERATION_CONTRACT_VERSION = 1;
export const OPERATIONS = Object.freeze({
  cli: Object.freeze(["sandbox.create", "sandbox.get", "sandbox.list", "sandbox.delete", "sandbox.timeout", "sandbox.pause", "sandbox.resume", "template.prepare", "exec.run", "exec.stream", "files.read", "files.write", "files.list", "files.stat", "files.remove", "files.move", "ports.resolve", "code.execute", "code.context.create", "code.context.execute", "code.context.list", "code.context.restart", "code.context.delete", "code.default-context.execute"]),
  python: Object.freeze(["sandbox.create", "sandbox.get", "sandbox.list", "sandbox.delete", "sandbox.timeout", "sandbox.pause", "sandbox.resume", "exec.run", "exec.stream", "files.read", "files.write", "files.list", "files.stat", "files.remove", "files.move", "ports.resolve", "code.execute", "code.context.create", "code.context.execute", "code.context.list", "code.context.restart", "code.context.delete", "code.default-context.execute"]),
});

export const WORKFLOW_INPUTS = Object.freeze(["source", "managed"]);
export const STARTUP_MODES = Object.freeze(["exec", "entrypoint", "none"]);
