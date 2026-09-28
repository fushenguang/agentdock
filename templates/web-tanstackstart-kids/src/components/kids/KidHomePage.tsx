import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Grid } from "@astryxdesign/core/Grid";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { useTranslator } from "@astryxdesign/core/i18n";
import { useCurrentLocale } from "@/i18n";
import * as stylex from "@stylexjs/stylex";
import { KidActionCard, KidIconBadge, KidIllustration, KidPageHeader, KidReadAlong } from ".";

const styles = stylex.create({
  page: {
    marginInline: "auto",
  },
});

interface KidHomePageProps {
  readonly completionCount: number;
}

export function KidHomePage({ completionCount }: KidHomePageProps) {
  const locale = useCurrentLocale();
  const t = useTranslator();

  return (
    <Stack gap={8} width="100%" maxWidth={1120} xstyle={styles.page}>
      <KidPageHeader
        title={t("agentdock.home.title")}
        description={t("agentdock.home.description")}
        illustration={<KidIllustration kind="welcome" size={180} />}
        actions={
          <Button
            label={t("agentdock.home.primary")}
            variant="primary"
            href={`/${locale}/activity`}
          />
        }
      />

      <Grid columns={{ minWidth: 260, max: 3 }} gap={5}>
        <KidActionCard
          label={t("agentdock.home.activity.title")}
          title={t("agentdock.home.activity.title")}
          description={t("agentdock.home.activity.description")}
          icon={<KidIconBadge name="activity" tone="mint" />}
          href={`/${locale}/activity`}
        />
        <KidActionCard
          label={t("agentdock.home.guardian.title")}
          title={t("agentdock.home.guardian.title")}
          description={t("agentdock.home.guardian.description")}
          icon={<KidIconBadge name="guardian" tone="sun" />}
          href={`/${locale}/guardian`}
        />
      </Grid>

      <Text type="supporting" color="secondary">
        {t("agentdock.home.triedCount", { count: completionCount })}
      </Text>

      <Card variant="muted" elevation="low">
        <KidReadAlong
          text={t("agentdock.home.readAlong")}
          readLabel={t("agentdock.home.readLabel")}
          stopLabel={t("agentdock.home.stopLabel")}
          transcriptLabel={t("agentdock.home.transcriptLabel")}
          unavailableLabel={t("agentdock.home.audioUnavailable")}
        />
      </Card>
    </Stack>
  );
}
