import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { AppI18nProvider, DEFAULT_LOCALE, isSupportedLocale } from "@/i18n";
import { TemplateShell } from "@/components/layout";

export const Route = createFileRoute("/$locale")({
  beforeLoad: ({ params }) => {
    if (!isSupportedLocale(params.locale)) {
      throw redirect({ to: "/$locale", params: { locale: DEFAULT_LOCALE } });
    }
  },
  component: LocaleLayout,
});

function LocaleLayout() {
  const { locale } = Route.useParams();
  if (!isSupportedLocale(locale)) {
    throw new Error(`Unsupported locale: ${locale}`);
  }

  return (
    <AppI18nProvider locale={locale}>
      <TemplateShell>
        <Outlet />
      </TemplateShell>
    </AppI18nProvider>
  );
}
