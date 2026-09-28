import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("reduced motion contract", () => {
  it("disables long motion and smooth scrolling when requested", () => {
    const css = readFileSync(join(process.cwd(), "src/styles/app.css"), "utf8");

    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).toContain("animation-duration: 1ms !important");
    expect(css).toContain("transition-duration: 1ms !important");
    expect(css).toContain("scroll-behavior: auto !important");
  });
});
