export const SUPPORTED_LOCALES = ["zh-CN", "en"] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = "zh-CN";

export const LOCALE_OPTIONS = {
  en: { label: "English" },
  "zh-CN": { label: "简体中文" },
} satisfies Record<AppLocale, { readonly label: string }>;

export function isSupportedLocale(value: string): value is AppLocale {
  return SUPPORTED_LOCALES.some((locale) => locale === value);
}
