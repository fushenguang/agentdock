import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const bannedPackages = ["animal-island-ui", "naive-icons"];
const declared = { ...packageJson.dependencies, ...packageJson.devDependencies };
const violations = [];

for (const name of bannedPackages) {
  if (declared[name]) {
    violations.push(`banned runtime dependency: ${name}`);
  }
}

const provenancePath = join(root, "docs", "reference", "animal-island-ui.md");
try {
  const provenance = readFileSync(provenancePath, "utf8");
  if (!provenance.includes("29051196bd7586d4484b55431b03178e6046fa64")) {
    violations.push("animal-island-ui provenance record is missing the reviewed commit");
  }
} catch {
  violations.push("missing docs/reference/animal-island-ui.md");
}

const binaryExtensions = new Set([
  ".avif",
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".webp",
  ".woff",
  ".woff2",
]);

function walk(directory) {
  for (const entry of readdirSync(directory)) {
    if (entry === "node_modules" || entry === "dist" || entry === ".output") {
      continue;
    }

    const path = join(directory, entry);
    const stat = lstatSync(path);
    if (stat.isSymbolicLink()) {
      continue;
    }
    if (stat.isDirectory()) {
      walk(path);
      continue;
    }

    const extension = extname(entry).toLowerCase();
    if (extension === ".svg" || binaryExtensions.has(extension)) {
      violations.push(
        `first-party binary/vector asset requires explicit review: ${relative(root, path)}`,
      );
    }
  }
}

walk(join(root, "src"));

if (violations.length > 0) {
  console.error("Asset and dependency check failed:");
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log("Asset and dependency check passed.");
