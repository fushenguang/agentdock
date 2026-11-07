import { readFileSync } from "node:fs";
import { join } from "node:path";

export function readDesignContract(root) {
  const source = readFileSync(join(root, "DESIGN.md"), "utf8");
  const frontMatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontMatter) throw new Error("DESIGN.md must start with YAML front matter.");

  const lines = frontMatter[1].split(/\r?\n/);
  const values = {};
  let theme = {};
  let inTheme = false;
  for (const line of lines) {
    if (/^theme:\s*$/.test(line)) {
      inTheme = true;
      continue;
    }
    const match = line.match(/^(\s*)([A-Za-z][\w-]*):\s*(.*)$/);
    if (!match) continue;
    const [, indent, key, raw] = match;
    const value = raw.replace(/\s+#.*$/, "").trim();
    if (inTheme && indent) theme[key] = value;
    else if (!indent) {
      inTheme = false;
      values[key] = value;
    }
  }

  return {
    source,
    status: values.status,
    approvedBy: values.approvedBy,
    approvedAt: values.approvedAt,
    archetype: values.archetype,
    theme,
  };
}
