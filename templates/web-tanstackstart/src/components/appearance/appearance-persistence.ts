import {
  APPEARANCE_COOKIE_MAX_AGE_SECONDS,
  APPEARANCE_COOKIE_NAME,
  parseAppearanceCookie,
  serializeAppearanceState,
  type AppearanceState,
} from "./appearance";

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

export function readAppearanceCookie(): AppearanceState {
  return parseAppearanceCookie(readCookieValue(APPEARANCE_COOKIE_NAME));
}

export function persistAppearance(state: AppearanceState): void {
  if (typeof document === "undefined") {
    return;
  }

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${APPEARANCE_COOKIE_NAME}=${encodeURIComponent(
    serializeAppearanceState(state),
  )}; Path=/; Max-Age=${APPEARANCE_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}
