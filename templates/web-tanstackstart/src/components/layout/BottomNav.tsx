/**
 * Bottom floating navigation.
 *
 * The Web is embedded in the App's right-hand panel, so the narrow viewport is the normal case:
 * navigation is a fixed, centred pill at the bottom rather than a top bar (which would spend a row
 * of the panel's scarcest resource, its height, and push content down on every page). It uses
 * `env(safe-area-inset-bottom)` and `aria-current` for the active destination. Astryx's `MobileNav`
 * is a slide-out drawer, not a bottom pill, so this is written in StyleX.
 *
 * `items` is the component's only variable surface — add a first-level destination by adding an entry
 * (and a message key) here. First-level routes are landings, so their labels are the destination
 * names, not page headings.
 */
import { useTranslator } from "@astryxdesign/core/i18n";
import * as stylex from "@stylexjs/stylex";
import { Link, useLocation } from "@tanstack/react-router";
import { useCurrentLocale } from "@/i18n";

const styles = stylex.create({
  nav: {
    position: "fixed",
    bottom: "max(0.9rem, env(safe-area-inset-bottom))",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 50,
    display: "flex",
    width: "min(31rem, calc(100vw - 2rem))",
    padding: "0.3rem",
    borderRadius: "var(--radius-full)",
    backgroundColor: "var(--color-background-card)",
    boxShadow: "var(--shadow-med)",
    /** No floating navigation when printing (the shell's print padding is dropped as well). */
    "@media print": { display: "none" },
  },
  item: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0.5rem 0",
    borderRadius: "var(--radius-full)",
    textDecoration: "none",
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "var(--color-text-secondary)",
    transition: "color 150ms ease, background-color 150ms ease",
  },
  itemActive: {
    color: "var(--color-text-accent)",
    backgroundColor: "var(--color-accent-muted)",
  },
});

interface NavItem {
  readonly key: string;
  readonly href: string;
  /** Active match: the pathname equals `href` (ignoring a trailing slash) or starts with it. */
  readonly match: (pathname: string) => boolean;
}

export function BottomNav() {
  const locale = useCurrentLocale();
  const pathname = useLocation({ select: (location) => location.pathname });
  const t = useTranslator();

  const items: readonly NavItem[] = [
    {
      key: "agentdock.nav.overview",
      href: `/${locale}`,
      match: (p) => p === `/${locale}` || p === `/${locale}/`,
    },
    {
      key: "agentdock.nav.hello",
      href: `/${locale}/hello`,
      match: (p) => p.startsWith(`/${locale}/hello`),
    },
    {
      key: "agentdock.nav.settings",
      href: `/${locale}/settings`,
      match: (p) => p.startsWith(`/${locale}/settings`),
    },
  ];

  return (
    <nav {...stylex.props(styles.nav)} aria-label={t("agentdock.nav.label")}>
      {items.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.key}
            to={item.href}
            aria-current={active ? "page" : undefined}
            {...stylex.props(styles.item, active && styles.itemActive)}
          >
            {t(item.key)}
          </Link>
        );
      })}
    </nav>
  );
}
