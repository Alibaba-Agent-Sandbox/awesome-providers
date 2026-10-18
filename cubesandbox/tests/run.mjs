import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const result = spawnSync(process.execPath, ["--test", fileURLToPath(new URL("templates.test.mjs", import.meta.url))], { stdio: "inherit" });
process.exit(result.status ?? 1);
