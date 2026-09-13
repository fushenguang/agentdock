import { AppShell } from "@astryxdesign/core/AppShell";
import { useTranslator } from "@astryxdesign/core/i18n";
import { TopNav, TopNavHeading, TopNavItem } from "@astryxdesign/core/TopNav";
import { useLocation } from "@tanstack/react-router";
import { AppearanceSwitcher } from "@/components/appearance";
import { LocaleSwitcher } from "@/components/locale";
import { useCurrentLocale } from "@/i18n";
import type { ReactNode } from "react";

interface TemplateShellProps {
  readonly children: ReactNode;
}

export function TemplateShell({ children }: TemplateShellProps) {
  const locale = useCurrentLocale();
  const pathname = useLocation({ select: (location) => location.pathname });
  const t = useTranslator();

  return (
    <AppShell
      variant="surface"
      contentPadding={6}
      topNav={
        <TopNav
          label={t("agentdock.nav.label")}
          heading={<TopNavHeading heading="{{PROJECT_NAME}}" headingHref={`/${locale}`} />}
          centerContent={
            <>
              <TopNavItem
                label={t("agentdock.nav.overview")}
                href={`/${locale}`}
                isSelected={pathname === `/${locale}` || pathname === `/${locale}/`}
              />
              <TopNavItem
                label={t("agentdock.nav.hello")}
                href={`/${locale}/hello`}
                isSelected={pathname.startsWith(`/${locale}/hello`)}
              />
            </>
          }
          endContent={
            <>
              <AppearanceSwitcher />
              <LocaleSwitcher />
            </>
          }
        />
      }
    >
      {children}
    </AppShell>
  );
}
