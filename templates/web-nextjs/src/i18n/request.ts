import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = (await requestLocale) ?? "en";

  return {
    locale,
    // Dynamic import keyed by locale — type is `any` from JSON, acceptable here.
    messages: (await import(`../../messages/${locale}.json`)).default as Record<string, unknown>,
  };
});
