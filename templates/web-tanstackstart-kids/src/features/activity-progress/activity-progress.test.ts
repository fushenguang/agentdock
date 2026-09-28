import { describe, expect, it } from "vitest";
import { normalizeActivityKey } from "./activity-progress";

describe("normalizeActivityKey", () => {
  it("normalizes a short kebab-case activity identifier", () => {
    expect(normalizeActivityKey("  Shape-Sort  ")).toBe("shape-sort");
  });

  it("rejects empty, path-like, or free-text values", () => {
    expect(() => normalizeActivityKey("")).toThrow("kebab-case");
    expect(() => normalizeActivityKey("../unsafe")).toThrow("kebab-case");
    expect(() => normalizeActivityKey("a child wrote this")).toThrow("kebab-case");
  });
});
