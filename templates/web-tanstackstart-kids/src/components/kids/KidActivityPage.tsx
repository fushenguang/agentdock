import { Button } from "@astryxdesign/core/Button";
import { Grid } from "@astryxdesign/core/Grid";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { useTranslator } from "@astryxdesign/core/i18n";
import { useState } from "react";
import * as stylex from "@stylexjs/stylex";
import {
  KidChoice,
  KidIconBadge,
  KidIllustration,
  KidPageHeader,
  KidProgress,
  KidReadAlong,
  KidState,
} from ".";

const styles = stylex.create({
  page: {
    marginInline: "auto",
  },
  hint: {
    minHeight: 24,
  },
});

const TOTAL_STEPS = 3;

interface KidActivityPageProps {
  readonly completionCount: number;
  readonly onComplete: () => Promise<void>;
}

export function KidActivityPage({ completionCount, onComplete }: KidActivityPageProps) {
  const t = useTranslator();
  const [step, setStep] = useState(0);
  const [choice, setChoice] = useState<"circle" | "square" | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <Stack gap={6} width="100%" maxWidth={720} xstyle={styles.page}>
        <KidState
          kind="error"
          title={t("agentdock.states.error")}
          description={t("agentdock.states.errorDescription")}
          actions={
            <Button
              label={t("agentdock.states.retry")}
              variant="primary"
              onClick={() => setHasError(false)}
            />
          }
        />
      </Stack>
    );
  }

  if (isComplete) {
    return (
      <Stack gap={6} width="100%" maxWidth={720} xstyle={styles.page}>
        <KidState
          kind="success"
          title={t("agentdock.activity.complete.title")}
          description={`${t("agentdock.activity.complete.description")} ${t(
            "agentdock.home.triedCount",
            { count: completionCount },
          )}`}
          actions={
            <Button
              label={t("agentdock.activity.restart")}
              variant="primary"
              onClick={() => {
                setStep(0);
                setChoice(null);
                setIsComplete(false);
                setHasError(false);
              }}
            />
          }
        />
      </Stack>
    );
  }

  return (
    <Stack gap={8} width="100%" maxWidth={900} xstyle={styles.page}>
      <KidPageHeader
        title={t("agentdock.activity.title")}
        description={t("agentdock.activity.description")}
        illustration={<KidIllustration kind="activity" size={160} />}
      />

      <KidProgress
        label={t("agentdock.activity.progress")}
        value={step + 1}
        max={TOTAL_STEPS}
        encouragement={t("agentdock.activity.encouragement")}
      />

      <Stack gap={4}>
        <Text type="supporting" color="secondary">
          {t("agentdock.activity.step", { current: step + 1, total: TOTAL_STEPS })}
        </Text>
        <Text type="large" weight="bold">
          {t("agentdock.activity.question")}
        </Text>

        <Grid columns={{ minWidth: 240, max: 2 }} gap={4}>
          <KidChoice
            label={t("agentdock.activity.choice.circle")}
            title={t("agentdock.activity.choice.circle")}
            description={t("agentdock.activity.choice.circleDescription")}
            icon={<KidIconBadge name="circle" tone="mint" />}
            isSelected={choice === "circle"}
            onSelect={() => setChoice("circle")}
          />
          <KidChoice
            label={t("agentdock.activity.choice.square")}
            title={t("agentdock.activity.choice.square")}
            description={t("agentdock.activity.choice.squareDescription")}
            icon={<KidIconBadge name="square" tone="sun" />}
            isSelected={choice === "square"}
            onSelect={() => setChoice("square")}
          />
        </Grid>
      </Stack>

      <Stack gap={3}>
        <Stack direction="horizontal" gap={3} wrap="wrap">
          {step > 0 ? (
            <Button
              label={t("agentdock.activity.back")}
              variant="secondary"
              onClick={() => {
                setChoice(null);
                setStep((current) => Math.max(0, current - 1));
              }}
            />
          ) : null}
          <Button
            label={t("agentdock.activity.next")}
            variant="primary"
            isDisabled={choice === null}
            clickAction={async () => {
              if (choice === null) {
                return;
              }

              if (step === TOTAL_STEPS - 1) {
                try {
                  await onComplete();
                  setIsComplete(true);
                } catch {
                  setHasError(true);
                }
                return;
              }

              setChoice(null);
              setStep((current) => current + 1);
            }}
          />
        </Stack>
        <Text type="supporting" color="secondary" xstyle={styles.hint}>
          {choice === null
            ? t("agentdock.activity.chooseFirst")
            : t("agentdock.activity.stateHint")}
        </Text>
      </Stack>

      <KidReadAlong
        text={t("agentdock.activity.description")}
        readLabel={t("agentdock.activity.readLabel")}
        stopLabel={t("agentdock.activity.stopLabel")}
        transcriptLabel={t("agentdock.activity.transcriptLabel")}
        unavailableLabel={t("agentdock.activity.audioUnavailable")}
      />
    </Stack>
  );
}
