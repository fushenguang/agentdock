import { spawnSync } from "node:child_process";

const provider = (process.env.DATA_PROVIDER ?? "sqlite").trim();

if (provider === "supabase") {
  console.log(
    "[agentdock] DATA_PROVIDER=supabase: skipping automatic SQLite migration. " +
      "Run `pnpm db:migrate:supabase` when the remote schema is ready.",
  );
  process.exit(0);
}

if (provider !== "sqlite") {
  console.error(
    `[agentdock] Unsupported DATA_PROVIDER "${provider}". Expected "sqlite" or "supabase".`,
  );
  process.exit(1);
}

const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const result = spawnSync(pnpmCommand, ["db:migrate"], {
  env: process.env,
  stdio: "inherit",
});

if (result.error) {
  console.error(`[agentdock] Failed to start Drizzle migration: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
