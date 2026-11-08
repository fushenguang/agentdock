#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const SKILL = "astryx-web-design";
const PACKAGE_SKILL = join("@cogito.ai", "astryx-web", "skills", SKILL);

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function sha256(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

export function findProjectRoot(start = process.cwd()) {
  let current = resolve(start);
  while (true) {
    if (existsSync(join(current, ".agents/skills", SKILL))) return current;
    const parent = resolve(current, "..");
    if (parent === current) return resolve(start);
    current = parent;
  }
}

export function findSkillSource(root) {
  const workspaceCandidate = resolve(root, "..", "..", "packages/astryx-web/skills", SKILL);
  const candidates = [
    process.env.ASTRYX_WEB_SKILL_SOURCE,
    workspaceCandidate,
    join(root, "node_modules", PACKAGE_SKILL),
    join(root, "apps/web/node_modules", PACKAGE_SKILL),
  ].filter(Boolean);

  const packageRoot = join(root, "packages");
  if (existsSync(packageRoot)) {
    for (const name of readdirSync(packageRoot)) {
      candidates.push(
        join(packageRoot, name, "apps/web/node_modules", PACKAGE_SKILL),
        join(packageRoot, name, "node_modules", PACKAGE_SKILL),
      );
    }
  }

  return candidates.find((candidate) => existsSync(join(candidate, "SKILL.md"))) ?? null;
}

export function checkSkill(root = findProjectRoot()) {
  const findings = [];
  const vendor = join(root, ".agents/skills", SKILL);
  const source = findSkillSource(root);
  if (!existsSync(vendor)) {
    return [`Missing vendored skill ${vendor}. Run pnpm design:sync-skill.`];
  }
  if (!source) {
    return ["Cannot find @cogito.ai/astryx-web skill source. Install the package first."];
  }

  const sourceFiles = new Set(walk(source).map((file) => relative(source, file)));
  const vendorFiles = new Set(walk(vendor).map((file) => relative(vendor, file)));
  for (const file of new Set([...sourceFiles, ...vendorFiles])) {
    if (!sourceFiles.has(file)) {
      findings.push(`Vendored skill has extra file ${file}. Run pnpm design:sync-skill.`);
    } else if (!vendorFiles.has(file)) {
      findings.push(`Vendored skill is missing ${file}. Run pnpm design:sync-skill.`);
    } else if (sha256(join(source, file)) !== sha256(join(vendor, file))) {
      findings.push(`Vendored skill differs at ${file}. Run pnpm design:sync-skill.`);
    }
  }

  const link = join(root, ".claude/skills", SKILL);
  if (!existsSync(link) || !lstatSync(link).isSymbolicLink()) {
    findings.push(`Missing symlink ${link}. Run pnpm design:sync-skill.`);
  } else {
    try {
      if (realpathSync(link) !== realpathSync(vendor)) {
        findings.push(`Symlink ${link} does not resolve to the vendored skill.`);
      }
    } catch {
      findings.push(`Broken symlink ${link}. On Windows enable core.symlinks.`);
    }
  }
  return findings;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const findings = checkSkill();
  if (findings.length > 0) {
    for (const finding of findings) console.error(finding);
    process.exitCode = 1;
  } else {
    console.log("Vendored design skill matches @cogito.ai/astryx-web.");
  }
}
