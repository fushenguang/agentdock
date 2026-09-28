import { KidAdvancedComponentsPage } from "@/components/kids";
import { DEFAULT_LOCALE, isSupportedLocale } from "@/i18n";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/advanced-components")({
  component: KidAdvancedComponentsPageRoute,
});

function KidAdvancedComponentsPageRoute() {
  const { locale: routeLocale } = Route.useParams();
  const locale = isSupportedLocale(routeLocale) ? routeLocale : DEFAULT_LOCALE;
  return <KidAdvancedComponentsPage locale={locale} />;
}
