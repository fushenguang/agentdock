import { InternationalizationProvider } from "@astryxdesign/core/i18n";
import { getLocaleDirection } from "@astryxdesign/core/i18n";
import type { ReactNode } from "react";
import { APP_MESSAGES } from "./messages";
import type { AppLocale } from "./locales";

interface AppI18nProviderProps {
  readonly locale: AppLocale;
  readonly children: ReactNode;
}

export function AppI18nProvider({ locale, children }: AppI18nProviderProps) {
  return (
    <InternationalizationProvider
      locale={locale}
      messages={APP_MESSAGES}
      dir={getLocaleDirection(locale)}
    >
      {children}
    </InternationalizationProvider>
  );
}
