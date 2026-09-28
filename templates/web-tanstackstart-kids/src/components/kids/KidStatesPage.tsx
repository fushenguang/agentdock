import { Card } from "@astryxdesign/core/Card";
import { Grid } from "@astryxdesign/core/Grid";
import { Stack } from "@astryxdesign/core/Stack";
import { useTranslator } from "@astryxdesign/core/i18n";
import * as stylex from "@stylexjs/stylex";
import { KidPageHeader, KidState, type KidStateKind } from ".";

const styles = stylex.create({
  page: {
    marginInline: "auto",
  },
});

const STATE_KEYS = [
  "loading",
  "empty",
  "waiting",
  "offline",
  "permission",
  "error",
  "success",
] as const;

export function KidStatesPage() {
  const t = useTranslator();

  return (
    <Stack gap={8} width="100%" maxWidth={1120} xstyle={styles.page}>
      <KidPageHeader
        title={t("agentdock.states.title")}
        description={t("agentdock.states.description")}
      />
      <Grid columns={{ minWidth: 280, max: 3 }} gap={5}>
        {STATE_KEYS.map((key) => (
          <Card key={key} variant="muted" elevation="low">
            <KidState
              kind={key satisfies KidStateKind}
              title={t(`agentdock.states.${key}`)}
              description={t(`agentdock.states.${key}Description`)}
            />
          </Card>
        ))}
      </Grid>
    </Stack>
  );
}
