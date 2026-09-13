import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const templateRoot = process.cwd();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

describe("template package-manager configuration", () => {
  it("keeps pnpm 12 as the declared package manager", () => {
    const parsed: unknown = JSON.parse(readFileSync(join(templateRoot, "package.json"), "utf8"));
    if (!isRecord(parsed)) {
      throw new Error("package.json did not parse to an object");
    }
    const engines = isRecord(parsed.engines) ? parsed.engines : {};

    expect(parsed.packageManager).toBe("pnpm@12.4.1");
    expect(engines.pnpm).toBe(">=12 <13");
  });

  it("disables pnpm self-management and enforces the engine range", () => {
    const npmrc = readFileSync(join(templateRoot, ".npmrc"), "utf8");

    expect(npmrc).toContain("manage-package-manager-versions=false");
    expect(npmrc).toContain("engine-strict=true");
  });
});

describe("template development database bootstrap", () => {
  it("prepares the selected data provider before starting Vite", () => {
    const parsed: unknown = JSON.parse(readFileSync(join(templateRoot, "package.json"), "utf8"));
    if (!isRecord(parsed)) {
      throw new Error("package.json did not parse to an object");
    }
    const scripts = isRecord(parsed.scripts) ? parsed.scripts : {};

    expect(scripts.dev).toContain("pnpm dev:prepare");
    expect(scripts.dev).toContain("vite dev");
    expect(scripts["dev:prepare"]).toBe("node scripts/prepare-dev-db.mjs");

    const scriptPath = join(templateRoot, "scripts/prepare-dev-db.mjs");
    expect(existsSync(scriptPath)).toBe(true);

    const source = readFileSync(scriptPath, "utf8");
    expect(source).toContain('provider === "supabase"');
    expect(source).toContain('"db:migrate"');
    expect(source).toContain("db:migrate:supabase");
  });
});
