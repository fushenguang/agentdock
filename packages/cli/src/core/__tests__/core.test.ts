import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { isVersionCompatible, checkVersion } from "../version.js";
import { scaffoldProject } from "../scaffold.js";
import type { RegistryTemplate } from "../registry.js";
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

// ─── version.ts tests ─────────────────────────────────────────────────────────

describe("isVersionCompatible", () => {
  it("returns true when cli version equals min version", () => {
    expect(isVersionCompatible("0.1.0", "0.1.0")).toBe(true);
  });

  it("returns true when cli version is higher (patch)", () => {
    expect(isVersionCompatible("0.1.1", "0.1.0")).toBe(true);
  });

  it("returns true when cli version is higher (minor)", () => {
    expect(isVersionCompatible("0.2.0", "0.1.0")).toBe(true);
  });

  it("returns true when cli version is higher (major)", () => {
    expect(isVersionCompatible("1.0.0", "0.9.9")).toBe(true);
  });

  it("returns false when cli version is lower (patch)", () => {
    expect(isVersionCompatible("0.1.0", "0.1.1")).toBe(false);
  });

  it("returns false when cli version is lower (minor)", () => {
    expect(isVersionCompatible("0.1.9", "0.2.0")).toBe(false);
  });

  it("returns false when cli version is lower (major)", () => {
    expect(isVersionCompatible("0.9.9", "1.0.0")).toBe(false);
  });
});

describe("checkVersion", () => {
  it("does not throw when version is compatible", () => {
    expect(() => checkVersion("0.2.0", "0.1.0", "web-nextjs")).not.toThrow();
  });

  it("throws CLI_VERSION_OUTDATED error when outdated", () => {
    let thrown: unknown;
    try {
      checkVersion("0.1.0", "0.2.0", "web-nextjs");
    } catch (err) {
      thrown = err;
    }
    expect(thrown).toBeDefined();
    expect((thrown as { error: string }).error).toBe("CLI_VERSION_OUTDATED");
    expect((thrown as { context: { template: string } }).context.template).toBe("web-nextjs");
  });
});

// ─── scaffold.ts tests ────────────────────────────────────────────────────────

const fakeTemplate: RegistryTemplate = {
  id: "test-template",
  name: "@test/template",
  description: "Test template",
  minCliVersion: "0.1.0",
  source: "templates/test-template",
  resolvedDependencies: {
    "@cogito.ai/tsconfig": "^0.1.0",
    "@cogito.ai/eslint-config": "^0.1.0",
  },
};

describe("scaffoldProject", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `agentdock-test-${Date.now()}`);
  });

  afterEach(() => {
    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  });

  it("returns TARGET_DIR_EXISTS when directory is non-empty", () => {
    mkdirSync(tmpDir, { recursive: true });
    writeFileSync(join(tmpDir, "file.txt"), "hello");

    const result = scaffoldProject({
      targetDir: tmpDir,
      name: "my-app",
      template: fakeTemplate,
    });

    expect(result.ok).toBe(false);
    expect((result as { error: string }).error).toBe("TARGET_DIR_EXISTS");
  });

  it("returns CLI_VERSION_OUTDATED when template requires newer cli", () => {
    const outdatedTemplate: RegistryTemplate = {
      ...fakeTemplate,
      minCliVersion: "99.0.0",
    };

    const result = scaffoldProject({
      targetDir: tmpDir,
      name: "my-app",
      template: outdatedTemplate,
    });

    expect(result.ok).toBe(false);
    expect((result as { error: string }).error).toBe("CLI_VERSION_OUTDATED");
  });

  it("scaffolds web-nextjs template and rewrites workspace deps", () => {
    const targetDir = join(tmpDir, "my-app");
    const template: RegistryTemplate = {
      id: "web-nextjs",
      name: "web-nextjs",
      description: "web-nextjs",
      minCliVersion: "0.1.0",
      source: "templates/web-nextjs",
      resolvedDependencies: {
        "@cogito.ai/eslint-config": "^0.1.0",
        "@cogito.ai/tsconfig": "^0.1.0",
      },
    };

    const result = scaffoldProject({
      targetDir,
      name: "my-app",
      template,
      packageManager: "pnpm",
    });

    expect(result.ok).toBe(true);
    expect(existsSync(join(targetDir, "package.json"))).toBe(true);

    const pkg = JSON.parse(
      readFileSync(join(targetDir, "package.json"), "utf-8")
    ) as {
      name: string;
      private?: boolean;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      agentdock?: unknown;
    };

    expect(pkg.name).toBe("my-app");
    expect(pkg.private).toBeUndefined();
    expect(pkg.agentdock).toBeUndefined();
    expect(pkg.devDependencies?.["@cogito.ai/eslint-config"]).toBe("^0.1.0");
    expect(pkg.devDependencies?.["@cogito.ai/tsconfig"]).toBe("^0.1.0");
  });
});

// ─── workspace:* resolution (via generate-registry logic) ─────────────────────

describe("resolvedDependencies (workspace:* replacement)", () => {
  it("resolved deps contain no workspace:* entries", () => {
    const deps = fakeTemplate.resolvedDependencies;
    for (const ver of Object.values(deps)) {
      expect(ver).not.toBe("workspace:*");
    }
  });

  it("resolved deps use semver caret ranges", () => {
    const deps = fakeTemplate.resolvedDependencies;
    for (const ver of Object.values(deps)) {
      expect(ver).toMatch(/^\^?\d+\.\d+\.\d+/);
    }
  });
});
