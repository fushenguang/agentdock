import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const templateRoot = process.cwd();
const workspaceContextPath = join(templateRoot, ".agentdock", "workspace.json");
const isWorkspaceMember = existsSync(workspaceContextPath);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readPackageJson(): Record<string, unknown> {
  const parsed: unknown = JSON.parse(readFileSync(join(templateRoot, "package.json"), "utf8"));
  if (!isRecord(parsed)) {
    throw new Error("package.json did not parse to an object");
  }
  return parsed;
}

describe("template package-manager configuration", () => {
  it("supports pnpm 10.34.5 through 12 without an exact pin", () => {
    const parsed = readPackageJson();
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
    const parsed = readPackageJson();
    const scripts = isRecord(parsed.scripts) ? parsed.scripts : {};

    expect(scripts.dev).toContain("pnpm dev:prepare");
    expect(scripts.dev).toContain("vite dev");
    expect(scripts["dev:prepare"]).toBe("node scripts/prepare-dev-db.mjs");

    const scriptPath = join(templateRoot, "scripts", "prepare-dev-db.mjs");
    expect(existsSync(scriptPath)).toBe(true);

    const source = readFileSync(scriptPath, "utf8");
    expect(source).toContain('provider === "supabase"');
    expect(source).toContain('"db:migrate"');
    expect(source).toContain("db:migrate:supabase");
  });
});

describe("child template contracts", () => {
  it("ships the generated Astryx theme artifacts", () => {
    for (const ageBand of ["sprout", "explorer", "creator"]) {
      for (const extension of ["ts", "css", "js", "d.ts"]) {
        const path = join(
          templateRoot,
          "src",
          "components",
          "appearance",
          "themes",
          `kids-${ageBand}.${extension}`,
        );
        expect(existsSync(path), path).toBe(true);
      }
    }
  });

  it("does not depend on the reference component library", () => {
    const parsed = readPackageJson();
    const dependencies = isRecord(parsed.dependencies) ? parsed.dependencies : {};
    const devDependencies = isRecord(parsed.devDependencies) ? parsed.devDependencies : {};

    expect(dependencies["animal-island-ui"]).toBeUndefined();
    expect(dependencies["naive-icons"]).toBeUndefined();
    expect(devDependencies["animal-island-ui"]).toBeUndefined();
    expect(devDependencies["naive-icons"]).toBeUndefined();
  });

  it("keeps the child profile cookie coarse", () => {
    const source = readFileSync(
      join(templateRoot, "src", "components", "appearance", "kids-experience.ts"),
      "utf8",
    );

    expect(source).toContain('"sprout"');
    expect(source).toContain('"explorer"');
    expect(source).toContain('"creator"');
    expect(source).not.toContain("birthDate");
    expect(source).not.toContain("dateOfBirth");
  });
});
