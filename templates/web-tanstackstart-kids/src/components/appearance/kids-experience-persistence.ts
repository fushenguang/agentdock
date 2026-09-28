import {
  KIDS_EXPERIENCE_COOKIE_MAX_AGE_SECONDS,
  KIDS_EXPERIENCE_COOKIE_NAME,
  parseKidsExperienceCookie,
  serializeKidsExperienceState,
  type KidsExperienceState,
} from "./kids-experience";

function readCookieValue(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const prefix = `${name}=`;
  const entry = document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(prefix));

  if (!entry) {
    return null;
  }

  try {
    return decodeURIComponent(entry.slice(prefix.length));
  } catch {
    return null;
  }
}

export function readKidsExperienceCookie(): KidsExperienceState {
  return parseKidsExperienceCookie(readCookieValue(KIDS_EXPERIENCE_COOKIE_NAME));
}

export function persistKidsExperience(state: KidsExperienceState): void {
  if (typeof document === "undefined") {
    return;
  }

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${KIDS_EXPERIENCE_COOKIE_NAME}=${encodeURIComponent(
    serializeKidsExperienceState(state),
  )}; Path=/; Max-Age=${KIDS_EXPERIENCE_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}
