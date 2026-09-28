import { describe, expect, it } from "vitest";
import {
  AGE_BANDS,
  DEFAULT_KIDS_EXPERIENCE,
  KIDS_PROFILES,
  parseKidsExperienceCookie,
  parseKidsExperienceState,
  resolveChildCapabilities,
  serializeKidsExperienceState,
} from "./kids-experience";

describe("kids experience profiles", () => {
  it("keeps the supported age bands explicit", () => {
    expect(AGE_BANDS).toEqual(["sprout", "explorer", "creator"]);
  });

  it("maps every age band to a prebuilt theme and capability set", () => {
    for (const ageBand of AGE_BANDS) {
      expect(KIDS_PROFILES[ageBand].theme["__built"]).toBe(true);
      expect(KIDS_PROFILES[ageBand].theme.name).toBe(`kids-${ageBand}`);
      expect(KIDS_PROFILES[ageBand].capabilities.minTargetSize).toBeGreaterThanOrEqual(44);
    }
  });

  it("falls back for invalid profile data and rejects precise age input", () => {
    expect(parseKidsExperienceState("8", "light")).toEqual({
      ageBand: DEFAULT_KIDS_EXPERIENCE.ageBand,
      mode: "light",
    });
    expect(parseKidsExperienceState("sprout", "sepia")).toEqual({
      ageBand: "sprout",
      mode: "system",
    });
    expect(parseKidsExperienceCookie("2015-02-03.light")).toEqual(DEFAULT_KIDS_EXPERIENCE);
    expect(parseKidsExperienceCookie("creator.dark")).toEqual({
      ageBand: "creator",
      mode: "dark",
    });
  });

  it("serializes only the coarse age band and mode", () => {
    expect(serializeKidsExperienceState({ ageBand: "explorer", mode: "light" })).toBe(
      "explorer.light",
    );
    expect(parseKidsExperienceCookie("explorer.light")).toEqual({
      ageBand: "explorer",
      mode: "light",
    });
  });

  it("resolves capability overrides without changing the selected band", () => {
    const capabilities = resolveChildCapabilities("sprout", {
      maxPrimaryChoices: 2,
      readingSupport: "text-first",
    });

    expect(capabilities.maxPrimaryChoices).toBe(2);
    expect(capabilities.readingSupport).toBe("text-first");
    expect(capabilities.minTargetSize).toBe(56);
  });
});
