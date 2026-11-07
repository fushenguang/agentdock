#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, posix, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ROUTES_DIR = "src/routes";
const ROUTE_TREE = "src/routeTree.gen.ts";
const TEMPLATE_MARKER =
  /^\/\/ astryx-template: ([^|]+) \| package: ([^|]+) \| intent: .* \| astryx: /;
const EXEMPTION = /^\/\/ astryx-exempt: (.{10,})$/;

function filesUnder(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return filesUnder(path);
    return /\.(?:ts|tsx)$/.test(entry.name) && !entry.name.startsWith("-") ? [path] : [];
  });
}

function routeImportFor(root, file) {
  const routePath = relative(join(root, ROUTES_DIR), file)
    .replaceAll("\\", "/")
    .replace(/\.(?:ts|tsx)$/, "");
  return `./routes/${routePath}`;
}

function routeHasComponent(source) {
  const routeConfig = source.match(/createFileRoute\([\s\S]*?\)\(\{([\s\S]*?)\}\);/);
  return routeConfig ? /\bcomponent\s*:/.test(routeConfig[1]) : false;
}

export function checkPages(root, templateNames) {
  const treePath = join(root, ROUTE_TREE);
  if (!existsSync(treePath)) {
    return [`Missing ${ROUTE_TREE}. Run pnpm generate-routes first.`];
  }

  const tree = readFileSync(treePath, "utf8");
  const findings = [];
  for (const file of filesUnder(join(root, ROUTES_DIR))) {
    const relativeFile = relative(root, file).replaceAll("\\", "/");
    const basename = posix.basename(relativeFile);
    const source = readFileSync(file, "utf8");
    const line1 = source.split(/\r?\n/, 1)[0] ?? "";

    if (basename === "__root.tsx") continue;

    if (!tree.includes(routeImportFor(root, file))) {
      findings.push(`${relativeFile}: no Route export is present in ${ROUTE_TREE}`);
      continue;
    }
    if (/<Outlet\b/.test(source) || !routeHasComponent(source)) continue;

    const marker = line1.match(TEMPLATE_MARKER);
    if (marker) {
      const [, template, packageName] = marker;
      if (!templateNames.has(template.trim())) {
        findings.push(`${relativeFile}: line 1 names unknown template ${template.trim()}`);
      }
      if (!packageName.trim()) {
        findings.push(`${relativeFile}: line 1 marker has no package`);
      }
      continue;
    }

    const exemption = line1.match(EXEMPTION);
    if (!exemption) {
      findings.push(
        `${relativeFile}: add an astryx-template marker or // astryx-exempt: <reason> on line 1`,
      );
    }
  }
  return findings;
}

function loadTemplateNames(root) {
  const output = execFileSync("astryx", ["template", "--list", "--json"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const payload = JSON.parse(output);
  return new Set((payload.data ?? []).map((template) => template.id));
}

function main() {
  const root = resolve(process.cwd());
  const findings = checkPages(root, loadTemplateNames(root));
  if (findings.length > 0) {
    for (const finding of findings) console.error(finding);
    process.exitCode = 1;
    return;
  }
  console.log("Every route page has provenance.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
