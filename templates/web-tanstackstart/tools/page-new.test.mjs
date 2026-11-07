import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { runPageNew } from "./page-new.mjs";

const PAGES_INDEX = `import type { Catalog } from "@astryxdesign/core/i18n";

export interface PageCatalog {
  readonly en: Catalog;
  readonly "zh-CN": Catalog;
}

export const pageCatalogs: readonly PageCatalog[] = [];
`;

const SETTINGS_SOURCE = `import { Heading } from "@astryxdesign/core/Heading";

export default function DockSettings() {
  return <Heading level={1}>{t("page.__PAGE__.title")}</Heading>;
}

/*
astryx-messages
{"en":{"page.__PAGE__.title":"Settings"},"zh-CN":{"page.__PAGE__.title":"设置"}}
*/
`;

function makeRoot() {
  const root = mkdtempSync(join(tmpdir(), "page-new-test-"));
  mkdirSync(join(root, "src/i18n/pages"), { recursive: true });
  writeFileSync(join(root, "src/i18n/pages/index.ts"), PAGES_INDEX);
  return root;
}

function response(start, pages = []) {
  return JSON.stringify({
    data: { start, pages },
    meta: { answeredBy: { cli: "0.7.5" } },
  });
}

function mockExec(root, start, options = {}) {
  return vi.fn((command, args, cwd) => {
    if (command === "astryx" && args[0] === "build") {
      return response(start, options.pages);
    }
    if (command === "astryx" && args[0] === "template" && args[1] === "--list") {
      return JSON.stringify({
        data: [
          {
            id: "dock-settings",
            package: "@cogito.ai/astryx-web",
            isReady: true,
          },
          { id: "login", package: "@astryxdesign/core", isReady: true },
        ],
        meta: { answeredBy: { cli: "0.7.5" } },
      });
    }
    if (command === "astryx" && args[0] === "template") {
      const target = join(cwd, args[2]);
      mkdirSync(join(target, ".."), { recursive: true });
      writeFileSync(target, SETTINGS_SOURCE);
      return JSON.stringify({ data: { missingPackages: [] } });
    }
    if (
      command.endsWith("/node_modules/.bin/oxfmt") ||
      command.endsWith("/node_modules/.bin/tsr")
    ) {
      return "";
    }
    throw new Error(`unexpected command: ${command} ${args.join(" ")} (${root})`);
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("page:new", () => {
  it("rejects fallback and prints candidates plus the page-word-order hint", () => {
    const root = makeRoot();
    const execFile = mockExec(
      root,
      {
        name: "shell-top-nav",
        package: "@astryxdesign/core",
        basis: "fallback",
      },
      {
        pages: [
          {
            name: "dock-settings",
            package: "@cogito.ai/astryx-web",
            description: "Settings page",
          },
        ],
      },
    );
    try {
      expect(() =>
        runPageNew(["settings page on mobile", "--route", "settings"], {
          cwd: root,
          execFile,
          astryx: "astryx",
        }),
      ).toThrow(
        /Closest @cogito\.ai\/astryx-web templates:[\s\S]*dock-settings[\s\S]*Put the page type last/,
      );
      expect(
        execFile.mock.calls.some(([, args]) => args[0] === "template" && args[1] !== "--list"),
      ).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects a Core start without --allow-core", () => {
    const root = makeRoot();
    try {
      expect(() =>
        runPageNew(["login page", "--route", "login"], {
          cwd: root,
          astryx: "astryx",
          execFile: mockExec(root, {
            name: "login",
            package: "@astryxdesign/core",
            basis: "direct",
          }),
        }),
      ).toThrow(/not @cogito\.ai\/astryx-web/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("refuses to overwrite an existing route", () => {
    const root = makeRoot();
    const target = join(root, "src/routes/$locale/settings.tsx");
    mkdirSync(join(root, "src/routes/$locale"), { recursive: true });
    writeFileSync(target, "unchanged");
    try {
      expect(() =>
        runPageNew(["settings page with sections", "--route", "settings"], {
          cwd: root,
          astryx: "astryx",
          execFile: mockExec(root, {
            name: "dock-settings",
            package: "@cogito.ai/astryx-web",
            basis: "direct",
          }),
        }),
      ).toThrow(/Refusing to overwrite/);
      expect(readFileSync(target, "utf8")).toBe("unchanged");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("writes the marker, route, page id, and localized catalog", () => {
    const root = makeRoot();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    try {
      const result = runPageNew(["settings page with sections", "--route", "settings"], {
        cwd: root,
        astryx: "astryx",
        execFile: mockExec(root, {
          name: "dock-settings",
          package: "@cogito.ai/astryx-web",
          basis: "direct",
        }),
      });
      const page = readFileSync(result.target, "utf8");
      const catalog = readFileSync(join(root, "src/i18n/pages/settings.ts"), "utf8");
      const registry = readFileSync(join(root, "src/i18n/pages/index.ts"), "utf8");

      expect(page.split("\n")[0]).toContain("// astryx-template: dock-settings");
      expect(page).not.toContain("export default");
      expect(page).toContain('import { createFileRoute } from "@tanstack/react-router";');
      expect(page).toContain("export const Route = createFileRoute");
      expect(page).toContain("page.settings.title");
      expect(page).not.toContain("astryx-messages");
      expect(catalog).toContain("page.settings.title");
      expect(catalog).toContain("设置");
      expect(registry).toContain('from "./settings"');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
