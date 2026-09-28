import { gzipSync } from "node:zlib";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";

const root = process.cwd();
const themeRoot = join(root, "src", "components", "appearance", "themes");
const distRoot = join(root, "dist", "client", "assets");
const violations = [];

for (const ageBand of ["sprout", "explorer", "creator"]) {
  const path = join(themeRoot, `kids-${ageBand}.css`);
  let size = 0;
  try {
    size = statSync(path).size;
  } catch {
    violations.push(`missing theme stylesheet: ${path}`);
    continue;
  }
  if (size > 64 * 1024) {
    violations.push(`kids-${ageBand}.css exceeds 64 KiB (${size} bytes)`);
  }
}

let cssBytes = 0;
let jsBytes = 0;
let fontBytes = 0;
const fontExtensions = new Set([".woff", ".woff2"]);

try {
  for (const entry of readdirSync(distRoot)) {
    const path = join(distRoot, entry);
    const size = statSync(path).size;
    const extension = extname(entry).toLowerCase();
    if (extension === ".css") cssBytes += size;
    if (extension === ".js") jsBytes += size;
    if (fontExtensions.has(extension)) fontBytes += size;
  }
} catch {
  violations.push("dist/client/assets is missing; run pnpm build before budgets:check");
}

const cssGzipBytes = cssBytes > 0 ? gzipSync(readFileSync(findFirst(distRoot, ".css"))).length : 0;

if (cssBytes > 560 * 1024) {
  violations.push(`client CSS exceeds 560 KiB (${cssBytes} bytes)`);
}
if (cssGzipBytes > 128 * 1024) {
  violations.push(`largest gzipped CSS exceeds 128 KiB (${cssGzipBytes} bytes)`);
}
if (jsBytes > 1536 * 1024) {
  violations.push(`client JavaScript exceeds 1.5 MiB (${jsBytes} bytes)`);
}
if (fontBytes > 6 * 1024 * 1024) {
  violations.push(`emitted font assets exceed 6 MiB (${fontBytes} bytes)`);
}

function findFirst(directory, extension) {
  return readdirSync(directory)
    .filter((entry) => extname(entry).toLowerCase() === extension)
    .map((entry) => join(directory, entry))
    .toSorted((left, right) => statSync(right).size - statSync(left).size)[0];
}

if (violations.length > 0) {
  console.error("Budget check failed:");
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log(
  `Budget check passed: css=${(cssBytes / 1024).toFixed(1)} KiB, js=${(jsBytes / 1024).toFixed(1)} KiB, fonts=${(fontBytes / 1024).toFixed(1)} KiB.`,
);
