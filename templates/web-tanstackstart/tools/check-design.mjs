#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { readDesignContract } from "./design-contract.mjs";

const ROUTES = "src/routes";

function routeFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return routeFiles(path);
    return /\.(?:ts|tsx)$/.test(entry.name) && !entry.name.startsWith("-") ? [path] : [];
  });
}

function hasComponent(source) {
  const config = source.match(/createFileRoute\([\s\S]*?\)\(\{([\s\S]*?)\}\);/);
  return config ? /\bcomponent\s*:/.test(config[1]) : false;
}

export function checkDesign(root) {
  const findings = [];
  let contract;
  try {
    contract = readDesignContract(root);
  } catch (error) {
    return [error instanceof Error ? error.message : String(error)];
  }

  if (!["draft", "approved"].includes(contract.status)) {
    findings.push("DESIGN.md status must be draft or approved.");
    return findings;
  }

  if (contract.status === "approved") {
    for (const [field, value] of [
      ["approvedBy", contract.approvedBy],
      ["approvedAt", contract.approvedAt],
      ["theme.base", contract.theme.base],
      ["theme.brandColor", contract.theme.brandColor],
    ]) {
      if (!value) findings.push(`Approved DESIGN.md requires ${field}.`);
    }
    const decisions = contract.source.split(/^## Decisions\s*$/m)[1] ?? "";
    if (!/^\d{4}-\d{2}-\d{2}\b/m.test(decisions)) {
      findings.push("Approved DESIGN.md requires a dated entry under Decisions.");
    }
    return findings;
  }

  const samplePath = join(root, "tools/sample-pages.json");
  const samples = new Set(
    existsSync(samplePath) ? JSON.parse(readFileSync(samplePath, "utf8")) : [],
  );
  for (const file of routeFiles(join(root, ROUTES))) {
    const relativeFile = relative(root, file).replaceAll("\\", "/");
    if (
      relativeFile === "src/routes/__root.tsx" ||
      relativeFile === "src/routes/$locale.tsx" ||
      relativeFile === "src/routes/index.tsx"
    ) {
      continue;
    }
    const source = readFileSync(file, "utf8");
    if (hasComponent(source) && !samples.has(relativeFile)) {
      findings.push(
        `${relativeFile} exists while DESIGN.md is draft. Approve the design direction before feature pages.`,
      );
    }
  }
  return findings;
}

function main() {
  const findings = checkDesign(resolve(process.cwd()));
  if (findings.length > 0) {
    for (const finding of findings) console.error(finding);
    process.exitCode = 1;
  } else {
    console.log("Design contract is valid.");
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
