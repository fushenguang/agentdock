import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const sourceRoot = join(root, "src");
const violations = [];
const forbiddenImportPatterns = [
  /from\s+["']@astryxdesign\/core\/src\//,
  /from\s+["']@astryxdesign\/core\/dist\//,
  /import\s*\(\s*["']@astryxdesign\/core\/src\//,
  /import\s*\(\s*["']@astryxdesign\/core\/dist\//,
];
const sourceExtensions = /\.(?:[cm]?[jt]sx?)$/;

function walk(directory) {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      walk(path);
      continue;
    }

    if (!sourceExtensions.test(entry)) {
      continue;
    }

    const source = readFileSync(path, "utf8");
    if (forbiddenImportPatterns.some((pattern) => pattern.test(source))) {
      violations.push(`${relative(root, path)} imports forbidden Astryx source or dist files`);
    }
  }
}

walk(sourceRoot);

for (const ageBand of ["sprout", "explorer", "creator"]) {
  const sourcePath = join(sourceRoot, "components", "appearance", "themes", `kids-${ageBand}.ts`);
  const cssPath = join(sourceRoot, "components", "appearance", "themes", `kids-${ageBand}.css`);
  const jsPath = join(sourceRoot, "components", "appearance", "themes", `kids-${ageBand}.js`);
  const dtsPath = join(sourceRoot, "components", "appearance", "themes", `kids-${ageBand}.d.ts`);

  for (const path of [sourcePath, cssPath, jsPath, dtsPath]) {
    try {
      statSync(path);
    } catch {
      violations.push(`missing generated Astryx theme artifact: ${relative(root, path)}`);
    }
  }
}

if (violations.length > 0) {
  console.error("Astryx boundary check failed:");
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log("Astryx boundary check passed.");
