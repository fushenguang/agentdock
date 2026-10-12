import { Blockquote } from "@astryxdesign/core/Blockquote";
import { ClickableCard } from "@astryxdesign/core/ClickableCard";
import { Heading } from "@astryxdesign/core/Heading";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { VisuallyHidden } from "@astryxdesign/core/VisuallyHidden";
import { useTranslator } from "@astryxdesign/core/i18n";
import * as stylex from "@stylexjs/stylex";
import { PageContainer } from "./layout";
import { useCurrentLocale } from "@/i18n";

/**
 * The first-level landing page.
 *
 * A first-level route is an **index**: it does not print its own name as a heading (the bottom
 * navigation already says it — the name stays as a `VisuallyHidden` `h1` for assistive technology),
 * it carries at most **one line** of orientation, and it lists the module entries that lead one route
 * deeper. The work happens on those routes.
 *
 * The entries are `ClickableCard`s because a module entry is an independently enterable unit — the one
 * place card chrome is allowed. Nothing is nested inside them, and they hold a title plus one line,
 * no cover art: a template has no business shipping licensed imagery.
 *
 * The column is a container-query grid: one column, then three from a 600px container, **never two**
 * (a 2 + 1 orphan row reads worse than stacking).
 */
const styles = stylex.create({
  entries: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr)",
    gap: "0.75rem",
    "@container (min-width: 600px)": {
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
      gap: "1rem",
    },
  },
});

interface ModuleEntry {
  readonly key: string;
  readonly href: string;
  readonly title: string;
  readonly description: string;
}

export function OverviewLanding() {
  const locale = useCurrentLocale();
  const t = useTranslator();

  const entries: readonly ModuleEntry[] = [
    {
      key: "hello",
      href: `/${locale}/hello`,
      title: t("agentdock.overview.module.hello.title"),
      description: t("agentdock.overview.module.hello.description"),
    },
    {
      key: "settings",
      href: `/${locale}/settings`,
      title: t("agentdock.overview.module.settings.title"),
      description: t("agentdock.overview.module.settings.description"),
    },
  ];

  return (
    <PageContainer>
      <VisuallyHidden>
        <Heading level={1}>{t("agentdock.nav.overview")}</Heading>
      </VisuallyHidden>
      <Blockquote>{t("agentdock.overview.tagline")}</Blockquote>
      <div {...stylex.props(styles.entries)}>
        {entries.map((entry) => (
          <ClickableCard key={entry.key} label={entry.title} href={entry.href} padding={3}>
            <Stack gap={1}>
              <Text type="body" weight="semibold">
                {entry.title}
              </Text>
              <Text type="supporting" color="secondary">
                {entry.description}
              </Text>
            </Stack>
          </ClickableCard>
        ))}
      </div>
    </PageContainer>
  );
}
