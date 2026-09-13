import type { DefinedTheme, ThemeMode } from "@astryxdesign/core/theme";
import { butterTheme } from "@astryxdesign/theme-butter/built";
import { matchaTheme } from "@astryxdesign/theme-matcha/built";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";
import { stoneTheme } from "@astryxdesign/theme-stone/built";

export const THEME_NAMES = ["neutral", "butter", "matcha", "stone"] as const;
export const APPEARANCE_MODES = ["system", "light", "dark"] as const satisfies readonly ThemeMode[];

export type ThemeName = (typeof THEME_NAMES)[number];
export type AppearanceMode = (typeof APPEARANCE_MODES)[number];

export const APPEARANCE_COOKIE_NAME = "agentdock.appearance";
export const APPEARANCE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export interface AppearanceState {
  readonly themeName: ThemeName;
  readonly mode: AppearanceMode;
}

export const DEFAULT_APPEARANCE: AppearanceState = {
  themeName: "neutral",
  mode: "system",
};

export const THEME_OPTIONS = {
  neutral: { label: "Neutral", theme: neutralTheme },
  butter: { label: "Butter", theme: butterTheme },
  matcha: { label: "Matcha", theme: matchaTheme },
  stone: { label: "Stone", theme: stoneTheme },
} satisfies Record<ThemeName, { readonly label: string; readonly theme: DefinedTheme }>;

export function isThemeName(value: string | null): value is ThemeName {
  return value !== null && THEME_NAMES.some((name) => name === value);
}

export function isAppearanceMode(value: string | null): value is AppearanceMode {
  return value !== null && APPEARANCE_MODES.some((mode) => mode === value);
}

export function parseAppearanceState(
  storedTheme: string | null,
  storedMode: string | null,
): AppearanceState {
  return {
    themeName: isThemeName(storedTheme) ? storedTheme : DEFAULT_APPEARANCE.themeName,
    mode: isAppearanceMode(storedMode) ? storedMode : DEFAULT_APPEARANCE.mode,
  };
}

export function serializeAppearanceState(state: AppearanceState): string {
  return `${state.themeName}.${state.mode}`;
}

export function parseAppearanceCookie(value: string | null | undefined): AppearanceState {
  if (!value) {
    return DEFAULT_APPEARANCE;
  }

  const parts = value.split(".");
  if (parts.length !== 2) {
    return DEFAULT_APPEARANCE;
  }

  return parseAppearanceState(parts[0] ?? null, parts[1] ?? null);
}
