import { AppShell } from "@astryxdesign/core/AppShell";
import { Button } from "@astryxdesign/core/Button";
import { Icon } from "@astryxdesign/core/Icon";
import { MobileNav } from "@astryxdesign/core/MobileNav";
import { SideNavItem } from "@astryxdesign/core/SideNav";
import { Stack } from "@astryxdesign/core/Stack";
import { TopNav, TopNavHeading, TopNavItem } from "@astryxdesign/core/TopNav";
import { useTranslator } from "@astryxdesign/core/i18n";
import { useLocation } from "@tanstack/react-router";
import { KidProfileSwitcher, useChildExperience } from "@/components/appearance";
import { LocaleSwitcher } from "@/components/locale";
import { useCurrentLocale } from "@/i18n";
import * as stylex from "@stylexjs/stylex";
import { useState, type ReactNode } from "react";

interface KidShellProps {
  readonly children: ReactNode;
}

const MIN_PRIMARY_CHOICES_FOR_GUARDIAN = 5;

const CONTENT_PADDING = {
  airy: 8,
  comfortable: 6,
  focused: 5,
} as const;

const styles = stylex.create({
  mobileOnly: {
    display: "flex",
    "@media (min-width: 1024px)": {
      display: "none",
    },
  },
  desktopOnly: {
    display: "none",
    "@media (min-width: 1024px)": {
      display: "flex",
    },
  },
  mobileDrawer: {
    paddingBlock: "var(--spacing-4)",
  },
  heading: {
    maxWidth: "55vw",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    "@media (min-width: 1024px)": {
      maxWidth: "none",
    },
  },
});

export function KidShell({ children }: KidShellProps) {
  const locale = useCurrentLocale();
  const pathname = useLocation({ select: (location) => location.pathname });
  const { capabilities } = useChildExperience();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const t = useTranslator();
  const isHome = pathname === `/${locale}` || pathname === `/${locale}/`;
  const isActivity = pathname.startsWith(`/${locale}/activity`);
  const isGuardian = pathname.startsWith(`/${locale}/guardian`);
  const isComponents = pathname.startsWith(`/${locale}/components`);

  return (
    <AppShell
      variant="surface"
      height="auto"
      contentPadding={CONTENT_PADDING[capabilities.density]}
      mobileNav={{
        breakpoint: "lg",
        hasToggle: false,
        isOpen: isMobileNavOpen,
        onOpenChange: setIsMobileNavOpen,
        content: (
          <MobileNav header="{{PROJECT_NAME}}" side="start">
            <Stack gap={3} xstyle={styles.mobileDrawer}>
              <SideNavItem
                label={t("agentdock.nav.home")}
                href={`/${locale}`}
                isSelected={isHome}
              />
              <SideNavItem
                label={t("agentdock.nav.activities")}
                href={`/${locale}/activity`}
                isSelected={isActivity}
              />
              <SideNavItem
                label={t("agentdock.nav.components")}
                href={`/${locale}/components`}
                isSelected={isComponents}
              />
              {capabilities.maxPrimaryChoices >= MIN_PRIMARY_CHOICES_FOR_GUARDIAN ? (
                <SideNavItem
                  label={t("agentdock.nav.guardian")}
                  href={`/${locale}/guardian`}
                  isSelected={isGuardian}
                />
              ) : null}
              <LocaleSwitcher />
              <KidProfileSwitcher />
            </Stack>
          </MobileNav>
        ),
      }}
      topNav={
        <TopNav
          label={t("agentdock.nav.label")}
          heading={
            <Stack direction="horizontal" gap={2} vAlign="center">
              <TopNavHeading
                heading="{{PROJECT_NAME}}"
                headingHref={`/${locale}`}
                xstyle={styles.heading}
              />
            </Stack>
          }
          startContent={
            <Stack direction="horizontal" gap={1} xstyle={styles.desktopOnly}>
              <TopNavItem label={t("agentdock.nav.home")} href={`/${locale}`} isSelected={isHome} />
              <TopNavItem
                label={t("agentdock.nav.activities")}
                href={`/${locale}/activity`}
                isSelected={isActivity}
              />
              <TopNavItem
                label={t("agentdock.nav.components")}
                href={`/${locale}/components`}
                isSelected={isComponents}
              />
              {capabilities.maxPrimaryChoices >= MIN_PRIMARY_CHOICES_FOR_GUARDIAN ? (
                <TopNavItem
                  label={t("agentdock.nav.guardian")}
                  href={`/${locale}/guardian`}
                  isSelected={isGuardian}
                />
              ) : null}
            </Stack>
          }
          endContent={
            <Stack direction="horizontal" gap={2} vAlign="center">
              <Stack direction="horizontal" xstyle={styles.mobileOnly}>
                <Button
                  variant="ghost"
                  label={t("agentdock.nav.open")}
                  icon={<Icon icon="menu" color="inherit" size="sm" />}
                  isIconOnly
                  data-testid="mobile-nav-toggle"
                  onClick={() => setIsMobileNavOpen(true)}
                />
              </Stack>
              <Stack direction="horizontal" gap={2} xstyle={styles.desktopOnly}>
                <KidProfileSwitcher />
                <LocaleSwitcher />
              </Stack>
            </Stack>
          }
        />
      }
    >
      {children}
    </AppShell>
  );
}
