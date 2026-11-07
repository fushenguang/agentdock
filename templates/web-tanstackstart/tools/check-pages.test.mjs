import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { checkPages } from "./check-pages.mjs";

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "check-pages-"));
  mkdirSync(join(root, "src/routes/$locale"), { recursive: true });
  writeFileSync(
    join(root, "src/routeTree.gen.ts"),
    [
      "import { Route as RootRouteImport } from './routes/__root'",
      "import { Route as LayoutRouteImport } from './routes/$locale'",
      "import { Route as IndexRouteImport } from './routes/$locale/index'",
      "import { Route as GoodRouteImport } from './routes/$locale/good'",
      "import { Route as ExemptRouteImport } from './routes/$locale/exempt'",
      "",
    ].join("\n"),
  );
  writeFileSync(join(root, "src/routes/__root.tsx"), "export const Route = {};\n");
  writeFileSync(
    join(root, "src/routes/$locale.tsx"),
    "export function Layout() { return <Outlet />; }\nexport const Route = {};\n",
  );
  writeFileSync(
    join(root, "src/routes/$locale/index.tsx"),
    'export const Route = createFileRoute("/")({});\n',
  );
  writeFileSync(
    join(root, "src/routes/$locale/good.tsx"),
    '// astryx-template: dock-list | package: @cogito.ai/astryx-web | intent: "list page" | astryx: 0.7.5\nexport const Route = createFileRoute("/good")({ component: Good });\n',
  );
  writeFileSync(
    join(root, "src/routes/$locale/exempt.tsx"),
    '// astryx-exempt: generated integration route\nexport const Route = createFileRoute("/exempt")({ component: Exempt });\n',
  );
  return root;
}

describe("check-pages", () => {
  it("passes marked and exempt component routes", () => {
    const root = fixture();
    try {
      expect(checkPages(root, new Set(["dock-list"]))).toEqual([]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects an unmarked page", () => {
    const root = fixture();
    try {
      writeFileSync(
        join(root, "src/routes/$locale/index.tsx"),
        'export const Route = createFileRoute("/")({ component: Index });\n',
      );
      expect(checkPages(root, new Set(["dock-list"])).join("\n")).toMatch(
        /index\.tsx: add an astryx-template marker/,
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects a route file missing from the generated tree", () => {
    const root = fixture();
    try {
      writeFileSync(
        join(root, "src/routes/$locale/raw.tsx"),
        "export default function Raw() { return null; }\n",
      );
      expect(checkPages(root, new Set(["dock-list"])).join("\n")).toMatch(
        /raw\.tsx: no Route export/,
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
