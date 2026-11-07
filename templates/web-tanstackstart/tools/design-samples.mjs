#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { join } from "node:path";

const executable =
  process.env.ASTRYX_WEB_BIN ??
  join(
    process.cwd(),
    "node_modules",
    ".bin",
    process.platform === "win32" ? "astryx-web.cmd" : "astryx-web",
  );
const args = process.argv.slice(2);
if (!args.includes("--base-url")) args.push("--base-url", "http://127.0.0.1:3000");
if (!args.includes("--out")) args.push("--out", "design-samples");

const result = spawnSync(executable, ["samples", ...args], {
  cwd: process.cwd(),
  env: process.env,
  stdio: "inherit",
});
process.exitCode = result.status ?? 1;
