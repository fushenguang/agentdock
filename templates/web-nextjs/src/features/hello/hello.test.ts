import { describe, it, expect } from "vitest";
import { greet } from "./index";

describe("hello feature — greet()", () => {
  it("returns a greeting with the provided name", () => {
    expect(greet("Alice")).toBe("Hello, Alice!");
  });

  it("returns a greeting with 'World' when name is an empty string", () => {
    expect(greet("")).toBe("Hello, World!");
  });

  it("returns a greeting with 'World' when name is only whitespace", () => {
    expect(greet("   ")).toBe("Hello, World!");
  });
});
