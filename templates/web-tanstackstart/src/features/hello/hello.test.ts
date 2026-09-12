import { describe, expect, it } from "vitest";
import { normalizeGreetingMessage } from "./hello";

describe("normalizeGreetingMessage", () => {
  it("trims surrounding whitespace", () => {
    expect(normalizeGreetingMessage("  hello  ")).toBe("hello");
  });

  it("rejects an empty message", () => {
    expect(() => normalizeGreetingMessage("   ")).toThrow("Greeting cannot be empty");
  });

  it("caps the stored message length", () => {
    expect(normalizeGreetingMessage("x".repeat(200))).toHaveLength(120);
  });
});
