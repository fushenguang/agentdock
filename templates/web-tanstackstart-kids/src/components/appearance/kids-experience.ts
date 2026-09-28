import type { DefinedTheme, ThemeMode } from "@astryxdesign/core/theme";
import { kidsCreatorTheme } from "./themes/kids-creator.js";
import { kidsExplorerTheme } from "./themes/kids-explorer.js";
import { kidsSproutTheme } from "./themes/kids-sprout.js";

export const AGE_BANDS = ["sprout", "explorer", "creator"] as const;
export const KIDS_THEME_MODES = ["system", "light", "dark"] as const satisfies readonly ThemeMode[];

export type AgeBand = (typeof AGE_BANDS)[number];
export type KidsThemeMode = (typeof KIDS_THEME_MODES)[number];

export interface ChildCapabilities {
  readonly minTargetSize: number;
  readonly density: "airy" | "comfortable" | "focused";
  readonly maxPrimaryChoices: number;
  readonly navigationDepth: number;
  readonly readingSupport: "audio-first" | "mixed" | "text-first";
  readonly motion: "gentle" | "playful" | "standard";
  readonly guidance: "always" | "contextual" | "on-demand";
  readonly confirmation: "explicit" | "confirm-or-undo" | "undo-first";
  readonly timeoutPolicy: "disabled" | "extended" | "standard";
}

export interface KidsExperienceState {
  readonly ageBand: AgeBand;
  readonly mode: KidsThemeMode;
}

export interface KidsProfileDefinition {
  readonly theme: DefinedTheme;
  readonly capabilities: ChildCapabilities;
}

export const DEFAULT_KIDS_EXPERIENCE: KidsExperienceState = {
  ageBand: "explorer",
  mode: "system",
};

export const KIDS_EXPERIENCE_COOKIE_NAME = "agentdock.kids.experience";
export const KIDS_EXPERIENCE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export const KIDS_PROFILES = {
  sprout: {
    theme: kidsSproutTheme,
    capabilities: {
      minTargetSize: 56,
      density: "airy",
      maxPrimaryChoices: 3,
      navigationDepth: 1,
      readingSupport: "audio-first",
      motion: "gentle",
      guidance: "always",
      confirmation: "explicit",
      timeoutPolicy: "disabled",
    },
  },
  explorer: {
    theme: kidsExplorerTheme,
    capabilities: {
      minTargetSize: 48,
      density: "comfortable",
      maxPrimaryChoices: 5,
      navigationDepth: 2,
      readingSupport: "mixed",
      motion: "playful",
      guidance: "contextual",
      confirmation: "confirm-or-undo",
      timeoutPolicy: "extended",
    },
  },
  creator: {
    theme: kidsCreatorTheme,
    capabilities: {
      minTargetSize: 44,
      density: "focused",
      maxPrimaryChoices: 7,
      navigationDepth: 3,
      readingSupport: "text-first",
      motion: "standard",
      guidance: "on-demand",
      confirmation: "undo-first",
      timeoutPolicy: "standard",
    },
  },
} satisfies Record<AgeBand, KidsProfileDefinition>;

export function isAgeBand(value: string | null | undefined): value is AgeBand {
  return value !== null && value !== undefined && AGE_BANDS.some((band) => band === value);
}

export function isKidsThemeMode(value: string | null | undefined): value is KidsThemeMode {
  return value !== null && value !== undefined && KIDS_THEME_MODES.some((mode) => mode === value);
}

export function parseKidsExperienceState(
  storedAgeBand: string | null | undefined,
  storedMode: string | null | undefined,
): KidsExperienceState {
  return {
    ageBand: isAgeBand(storedAgeBand) ? storedAgeBand : DEFAULT_KIDS_EXPERIENCE.ageBand,
    mode: isKidsThemeMode(storedMode) ? storedMode : DEFAULT_KIDS_EXPERIENCE.mode,
  };
}

export function serializeKidsExperienceState(state: KidsExperienceState): string {
  return `${state.ageBand}.${state.mode}`;
}

export function parseKidsExperienceCookie(value: string | null | undefined): KidsExperienceState {
  if (!value) {
    return DEFAULT_KIDS_EXPERIENCE;
  }

  const parts = value.split(".");
  if (parts.length !== 2 || !isAgeBand(parts[0]) || !isKidsThemeMode(parts[1])) {
    return DEFAULT_KIDS_EXPERIENCE;
  }

  return { ageBand: parts[0], mode: parts[1] };
}

export function resolveChildCapabilities(
  ageBand: AgeBand,
  overrides: Partial<ChildCapabilities> = {},
): ChildCapabilities {
  return {
    ...KIDS_PROFILES[ageBand].capabilities,
    ...overrides,
  };
}

export function resolveKidsTheme(ageBand: AgeBand): DefinedTheme {
  return KIDS_PROFILES[ageBand].theme;
}
