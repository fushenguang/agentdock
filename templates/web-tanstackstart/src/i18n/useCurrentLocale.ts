import { useLocation } from "@tanstack/react-router";
import { DEFAULT_LOCALE, isSupportedLocale } from "./locales";
import type { AppLocale } from "./locales";

export function useCurrentLocale(): AppLocale {
  const pathname = useLocation({ select: (location) => location.pathname });
  const segment = pathname.split("/")[1] ?? "";
  return isSupportedLocale(segment) ? segment : DEFAULT_LOCALE;
}
