import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Grid } from "@astryxdesign/core/Grid";
import { Heading } from "@astryxdesign/core/Heading";
import { List, ListItem } from "@astryxdesign/core/List";
import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { useTranslator } from "@astryxdesign/core/i18n";
import { useCurrentLocale } from "@/i18n";
import { PageContainer, PageHeader } from "./layout";

const CARD_KEYS = ["featureContracts", "repository", "design"] as const;
const START_STEP_KEYS = ["step1", "step2", "step3", "step4"] as const;

export function OverviewPage() {
  const locale = useCurrentLocale();
  const t = useTranslator();

  return (
    <PageContainer>
      <PageHeader
        title={t("agentdock.overview.title")}
        description={t("agentdock.overview.description")}
        actions={
          <Button
            label={t("agentdock.overview.openFeature")}
            href={`/${locale}/hello`}
            variant="primary"
          />
        }
      />

      <Grid columns={{ minWidth: 240, max: 3 }} gap={4}>
        {CARD_KEYS.map((key) => (
          <Card key={key} padding={4}>
            <Stack gap={3} height="100%">
              <Heading level={2}>{t(`agentdock.overview.${key}.title`)}</Heading>
              <Text type="body" color="secondary">
                {t(`agentdock.overview.${key}.description`)}
              </Text>
            </Stack>
          </Card>
        ))}
      </Grid>

      <Section padding={4}>
        <List
          density="balanced"
          header={<Heading level={2}>{t("agentdock.overview.start.title")}</Heading>}
          listStyle="decimal"
        >
          {START_STEP_KEYS.map((key) => (
            <ListItem key={key} label={t(`agentdock.overview.start.${key}`)} />
          ))}
        </List>
      </Section>
    </PageContainer>
  );
}
