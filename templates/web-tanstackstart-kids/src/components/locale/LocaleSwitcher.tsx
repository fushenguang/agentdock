import { DropdownMenu, type DropdownMenuOption } from "@astryxdesign/core/DropdownMenu";
import { useTranslator } from "@astryxdesign/core/i18n";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { LOCALE_OPTIONS, SUPPORTED_LOCALES } from "@/i18n";
import { localizedHref } from "@/i18n/locale-href";
import { useCurrentLocale } from "@/i18n/useCurrentLocale";

export function LocaleSwitcher() {
  const locale = useCurrentLocale();
  const location = useLocation();
  const navigate = useNavigate();
  const t = useTranslator();

  const items: DropdownMenuOption[] = [
    {
      type: "section",
      title: t("agentdock.locale.label"),
      items: SUPPORTED_LOCALES.map((option) => ({
        label: LOCALE_OPTIONS[option].label,
        icon: option === locale ? "check" : undefined,
        onClick: () =>
          void navigate({
            href: localizedHref(
              {
                pathname: location.pathname,
                searchStr: location.searchStr,
                hash: location.hash,
              },
              option,
            ),
          }),
      })),
    },
  ];

  return (
    <DropdownMenu
      button={{
        label: LOCALE_OPTIONS[locale].label,
        variant: "ghost",
        size: "sm",
      }}
      items={items}
      hasChevron
      presentation="adaptive"
    />
  );
}
