import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const templateRoot = process.cwd();
const workspaceContextPath = join(templateRoot, ".agentdock", "workspace.json");
const isWorkspaceMember = existsSync(workspaceContextPath);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

describe("template package-manager configuration", () => {
  it("supports pnpm 10.34.5 through 12 without an exact pin", () => {
    const parsed: unknown = JSON.parse(readFileSync(join(templateRoot, "package.json"), "utf8"));
    if (!isRecord(parsed)) {
      throw new Error("package.json did not parse to an object");
    }
    const engines = isRecord(parsed.engines) ? parsed.engines : {};

    if (isWorkspaceMember) {
      expect(parsed.packageManager).toBeUndefined();
      expect(engines.pnpm).toBeUndefined();
    } else {
      expect(parsed.packageManager).toBeUndefined();
      expect(engines.pnpm).toBe(">=10.34.5 <13");
    }
  });

  it("keeps install policy in pnpm-workspace.yaml", () => {
    if (isWorkspaceMember) {
      expect(existsSync(join(templateRoot, ".npmrc"))).toBe(false);
      expect(existsSync(join(templateRoot, "pnpm-workspace.yaml"))).toBe(false);
      expect(existsSync(join(templateRoot, "pnpm-lock.yaml"))).toBe(false);
      return;
    }

    expect(existsSync(join(templateRoot, ".npmrc"))).toBe(false);
    const workspaceYaml = readFileSync(join(templateRoot, "pnpm-workspace.yaml"), "utf8");

    expect(workspaceYaml).toContain("engineStrict: true");
    expect(workspaceYaml).toContain("allowBuilds:");
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
