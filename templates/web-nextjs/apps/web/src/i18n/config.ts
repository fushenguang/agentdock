export const locales = ['en', 'zh'] as const

export type AppLocale = (typeof locales)[number]

const envDefaultLocale = process.env.APP_DEFAULT_LOCALE

export const defaultLocale: AppLocale =
  envDefaultLocale === 'en' || envDefaultLocale === 'zh' ? envDefaultLocale : 'zh'

export function isLocale(value: string): value is AppLocale {
  return locales.includes(value as AppLocale)
}