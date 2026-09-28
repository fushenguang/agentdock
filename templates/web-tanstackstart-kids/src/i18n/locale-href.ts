import { isSupportedLocale, type AppLocale } from "./locales";

interface LocalizedHrefInput {
  readonly pathname: string;
  readonly searchStr: string;
  readonly hash: string;
}

export function localizedHref(
  { pathname, searchStr, hash }: LocalizedHrefInput,
  locale: AppLocale,
): string {
  const segments = pathname.split("/");
  if (isSupportedLocale(segments[1] ?? "")) {
    segments[1] = locale;
  } else {
    segments.splice(1, 0, locale);
  }

  const searchSuffix = searchStr && !searchStr.startsWith("?") ? `?${searchStr}` : searchStr;
  const hashSuffix = hash && !hash.startsWith("#") ? `#${hash}` : hash;
  return `${segments.join("/") || `/${locale}`}${searchSuffix}${hashSuffix}`;
}
