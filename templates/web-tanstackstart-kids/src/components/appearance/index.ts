export {
  AGE_BANDS,
  DEFAULT_KIDS_EXPERIENCE,
  KIDS_EXPERIENCE_COOKIE_NAME,
  KIDS_PROFILES,
  KIDS_THEME_MODES,
  isAgeBand,
  isKidsThemeMode,
  parseKidsExperienceCookie,
  parseKidsExperienceState,
  resolveChildCapabilities,
  resolveKidsTheme,
  serializeKidsExperienceState,
} from "./kids-experience";
export type {
  AgeBand,
  ChildCapabilities,
  KidsExperienceState,
  KidsProfileDefinition,
  KidsThemeMode,
} from "./kids-experience";
export { ChildExperienceProvider, useChildExperience } from "./ChildExperienceProvider";
export { KidProfileSwitcher } from "./KidProfileSwitcher";
