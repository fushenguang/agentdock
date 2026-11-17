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

const PAGE_BRIEF_FIELDS = [
  "Route",
  "Core function",
  "Primary action",
  "Above the fold",
  "Hidden by default",
  "Archetype",
];

function normalizeRoute(value) {
  const route = value.trim().replace(/^`|`$/g, "").replace(/\/+$/g, "");
  return route === "/$locale" ? "/$locale/" : route;
}

function tableCells(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim().replace(/^`|`$/g, ""));
}

export function readPageBrief(root, route) {
  const source = readFileSync(join(root, "DESIGN.md"), "utf8");
  const lines = source.split(/\r?\n/);
  const start = lines.findIndex((line) => /^## Page briefs\s*$/.test(line));
  if (start === -1) return null;
  const end = lines.findIndex((line, index) => index > start && /^##\s+/.test(line));
  const section = lines.slice(start + 1, end === -1 ? undefined : end);
  const headerIndex = section.findIndex((line) => line.trim().startsWith("|"));
  if (headerIndex === -1) return null;
  const headers = tableCells(section[headerIndex]);
  const expectedRoute = normalizeRoute(
    route === "index" ? "/$locale/" : `/$locale/${route.replace(/^\/+|\/+$/g, "")}`,
  );

  for (const line of section.slice(headerIndex + 2)) {
    if (!line.trim().startsWith("|")) continue;
    const values = tableCells(line);
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
    if (normalizeRoute(row.Route) !== expectedRoute) continue;
    return row;
  }
  return null;
}

export function requirePageBrief(root, route) {
  const brief = readPageBrief(root, route);
  const expectedRoute = route === "index" ? "/$locale/" : `/$locale/${route}`;
  if (!brief) {
    throw new Error(
      `Page brief missing for ${expectedRoute}. Ask for the page's core function, primary action, above-the-fold and hidden-by-default content, then add a row to DESIGN.md ## Page briefs.`,
    );
  }
  const missing = PAGE_BRIEF_FIELDS.filter((field) => !brief[field]);
  if (missing.length > 0) {
    throw new Error(`Page brief incomplete for ${expectedRoute}: ${missing.join(", ")}.`);
  }
  return brief;
}
