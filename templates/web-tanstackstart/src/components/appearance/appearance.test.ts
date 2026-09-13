import { describe, expect, it } from "vitest";
import {
  DEFAULT_APPEARANCE,
  APPEARANCE_MODES,
  THEME_NAMES,
  isAppearanceMode,
  isThemeName,
  parseAppearanceCookie,
  parseAppearanceState,
  serializeAppearanceState,
} from "./appearance";

describe("appearance configuration", () => {
  it("keeps the supported theme and mode lists explicit", () => {
    expect(THEME_NAMES).toEqual(["neutral", "butter", "matcha", "stone"]);
    expect(APPEARANCE_MODES).toEqual(["system", "light", "dark"]);
  });

  it("validates persisted values", () => {
    expect(isThemeName("matcha")).toBe(true);
    expect(isThemeName("unknown")).toBe(false);
    expect(isThemeName(null)).toBe(false);
    expect(isAppearanceMode("dark")).toBe(true);
    expect(isAppearanceMode("sepia")).toBe(false);
    expect(isAppearanceMode(null)).toBe(false);
  });

  it("falls back to the default appearance for invalid values", () => {
    expect(parseAppearanceState("unknown", "sepia")).toEqual(DEFAULT_APPEARANCE);
    expect(parseAppearanceState("stone", "dark")).toEqual({
      themeName: "stone",
      mode: "dark",
    });
  });

  it("serializes and parses the appearance cookie", () => {
    const appearance = { themeName: "butter", mode: "dark" } as const;
    expect(serializeAppearanceState(appearance)).toBe("butter.dark");
    expect(parseAppearanceCookie("butter.dark")).toEqual(appearance);
    expect(parseAppearanceCookie("unknown.sepia")).toEqual(DEFAULT_APPEARANCE);
    expect(parseAppearanceCookie("matcha")).toEqual(DEFAULT_APPEARANCE);
    expect(parseAppearanceCookie("matcha.dark.extra")).toEqual(DEFAULT_APPEARANCE);
    expect(parseAppearanceCookie(null)).toEqual(DEFAULT_APPEARANCE);
  });
});
