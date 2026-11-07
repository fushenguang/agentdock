import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { checkDesign } from "./check-design.mjs";

function contract(status, approvedBy = "Owner") {
  return `---
status: ${status}
approvedBy: ${approvedBy}
approvedAt: 2026-11-07
archetype: quiet-tool
theme:
  base: neutral
  brandColor: oklch(0.62 0.12 260)
  modes: [light, dark]
---

# Design contract

## Decisions

2026-11-07: Approved.
`;
}

function fixture(status = "draft") {
  const root = mkdtempSync(join(tmpdir(), "check-design-"));
  mkdirSync(join(root, "tools"), { recursive: true });
  mkdirSync(join(root, "src/routes/$locale"), { recursive: true });
  writeFileSync(join(root, "DESIGN.md"), contract(status));
  writeFileSync(
    join(root, "tools/sample-pages.json"),
    JSON.stringify(["src/routes/$locale/index.tsx"]),
  );
  writeFileSync(
    join(root, "src/routes/$locale/index.tsx"),
    'export const Route = createFileRoute("/")({ component: Index });\n',
  );
  return root;
}

describe("check-design", () => {
  it("rejects a feature page while the contract is draft", () => {
    const root = fixture();
    try {
      writeFileSync(
        join(root, "src/routes/$locale/feature.tsx"),
        'export const Route = createFileRoute("/feature")({ component: Feature });\n',
      );
      expect(checkDesign(root).join("\n")).toMatch(/exists while DESIGN.md is draft/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects an incomplete approval", () => {
    const root = fixture("approved");
    try {
      writeFileSync(join(root, "DESIGN.md"), contract("approved", ""));
      expect(checkDesign(root).join("\n")).toMatch(/requires approvedBy/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("accepts a complete approved contract", () => {
    const root = fixture("approved");
    try {
      expect(checkDesign(root)).toEqual([]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
