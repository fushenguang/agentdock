import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { RegistryTemplate } from "./registry.js";
import { checkVersion } from "./version.js";
import { VERSION as CLI_VERSION } from "../version.js";

export interface ScaffoldOptions {
  /** Target directory path (absolute or relative to cwd) */
  targetDir: string;
  /** Project name written into generated package.json */
  name: string;
  /** Template entry from the registry */
  template: RegistryTemplate;
  /** Package manager hint written into generated README / lock hint */
  packageManager?: "pnpm" | "npm" | "yarn" | "bun";
}

export interface ScaffoldResult {
  ok: true;
  targetDir: string;
  name: string;
  template: string;
}

export interface ScaffoldError {
  ok: false;
  error: "TARGET_DIR_EXISTS" | "CLI_VERSION_OUTDATED" | "SCAFFOLD_FAILED";
  message: string;
}

function getTemplateSourceDir(templateSource: string): string {
  const runtimeDir = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    // Built package layout: dist/templates/<id>
    join(runtimeDir, templateSource),
    // Monorepo source layout when running from src/core
    join(runtimeDir, "../../../..", templateSource),
    // Monorepo source layout fallback: <repo>/templates/<id>
    join(runtimeDir, "../../..", templateSource),
  ];

  const sourceDir = candidates.find((p) => existsSync(p));
  if (!sourceDir) {
    throw new Error(
      `Template source not found: ${templateSource}. Looked in: ${candidates.join(", ")}`
    );
  }

  return sourceDir;
}

function rewritePackageJson(
  pkgJsonPath: string,
  name: string,
  resolvedDependencies: Record<string, string>
): void {
  const raw = readFileSync(pkgJsonPath, "utf-8");
  const pkg = JSON.parse(raw) as Record<string, unknown>;

  pkg["name"] = name;
  pkg["version"] = "0.1.0";
  delete pkg["private"];
  // Remove the agentdock meta field from generated projects
  delete pkg["agentdock"];
  // Remove packageManager — Corepack enforcement on a pinned old version causes
  // PATH errors for users on newer pnpm versions. engines.pnpm already documents
  // the version requirement without enforcing a specific patch version.
  delete pkg["packageManager"];

  // Rewrite workspace:* deps with resolved versions
  for (const key of ["dependencies", "devDependencies", "peerDependencies"] as const) {
    const deps = pkg[key] as Record<string, string> | undefined;
    if (!deps) continue;
    for (const [dep, ver] of Object.entries(deps)) {
      if (ver === "workspace:*" && resolvedDependencies[dep]) {
        deps[dep] = resolvedDependencies[dep];
      }
    }
  }

  writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
}

export function scaffoldProject(
  options: ScaffoldOptions
): ScaffoldResult | ScaffoldError {
  const { targetDir, name, template, packageManager: _pm } = options;

  // Version compatibility check
  try {
    checkVersion(CLI_VERSION, template.minCliVersion, template.id);
  } catch (err) {
    return {
      ok: false,
      error: "CLI_VERSION_OUTDATED",
      message: JSON.stringify(err),
    };
  }

  // Guard: don't overwrite existing directory
  if (existsSync(targetDir) && readdirSync(targetDir).length > 0) {
    return {
      ok: false,
      error: "TARGET_DIR_EXISTS",
      message: `Target directory "${targetDir}" already exists and is not empty.`,
    };
  }

  try {
    const sourceDir = getTemplateSourceDir(template.source);
    mkdirSync(targetDir, { recursive: true });
    cpSync(sourceDir, targetDir, { recursive: true });

    // Rewrite package.json
    const pkgJsonPath = join(targetDir, "package.json");
    if (existsSync(pkgJsonPath)) {
      rewritePackageJson(pkgJsonPath, name, template.resolvedDependencies);
    }

    return {
      ok: true,
      targetDir,
      name,
      template: template.id,
    };
  } catch (err) {
    return {
      ok: false,
      error: "SCAFFOLD_FAILED",
      message: err instanceof Error ? err.message : String(err),
    };
  }
}
