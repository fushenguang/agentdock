import { KidShell } from "@/components/kids";
import { AppI18nProvider, DEFAULT_LOCALE, isSupportedLocale } from "@/i18n";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

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
      <KidShell>
        <Outlet />
      </KidShell>
    </AppI18nProvider>
  );
}
