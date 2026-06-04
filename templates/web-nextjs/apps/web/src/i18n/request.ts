import { getRequestConfig } from 'next-intl/server'
import { defaultLocale, isLocale } from './config'

export default getRequestConfig(async ({ requestLocale }) => {
  const candidateLocale = await requestLocale
  const locale = candidateLocale && isLocale(candidateLocale) ? candidateLocale : defaultLocale

  return {
    locale,
    // Dynamic import keyed by locale — type is `any` from JSON, acceptable here.
    messages: (await import(`../../messages/${locale}.json`)).default as Record<string, unknown>,
  }
})
