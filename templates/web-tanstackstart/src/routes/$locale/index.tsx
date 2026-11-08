// astryx-template: dock-landing | package: @cogito.ai/astryx-web | intent: "landing page with module entries" | astryx: 0.7.8
import { createFileRoute } from "@tanstack/react-router";

import { Blockquote } from "@astryxdesign/core/Blockquote";
import { ClickableCard } from "@astryxdesign/core/ClickableCard";
import { Grid } from "@astryxdesign/core/Grid";
import { Heading } from "@astryxdesign/core/Heading";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { VisuallyHidden } from "@astryxdesign/core/VisuallyHidden";
import { useTranslator } from "@astryxdesign/core/i18n";
import * as stylex from "@stylexjs/stylex";
import { PageContainer } from "@/components/layout";
import { useCurrentLocale } from "@/i18n";

const styles = stylex.create({
  entries: {
    gridTemplateColumns: "minmax(0, 1fr)",
    "@container (min-width: 600px)": {
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    },
  },
});

const SAMPLE_MODULES = [
  {
    id: "hello",
    path: "hello",
    titleKey: "page.index.module.hello.title",
    descriptionKey: "page.index.module.hello.description",
  },
  {
    id: "settings",
    path: "settings",
    titleKey: "page.index.module.settings.title",
    descriptionKey: "page.index.module.settings.description",
  },
] as const;
// Replace with feature data

function DockLanding() {
  const locale = useCurrentLocale();
  const t = useTranslator();

  return (
    <PageContainer>
      <VisuallyHidden>
        <Heading level={1}>{t("page.index.title")}</Heading>
      </VisuallyHidden>
      <Blockquote>{t("page.index.orientation")}</Blockquote>
      <Grid columns={2} gap={3} xstyle={styles.entries}>
        {SAMPLE_MODULES.map((module) => {
          const title = t(module.titleKey);
          return (
            <ClickableCard
              key={module.id}
              label={title}
              href={`/${locale}/${module.path}`}
              padding={3}
            >
              <Stack gap={1}>
                <Text type="body" weight="semibold">
                  {title}
                </Text>
                <Text type="supporting" color="secondary">
                  {t(module.descriptionKey)}
                </Text>
              </Stack>
            </ClickableCard>
          );
        })}
      </Grid>
    </PageContainer>
  );
}
export const Route = createFileRoute("/$locale/")({
  component: DockLanding,
});
