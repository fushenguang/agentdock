import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { useTranslator } from "@astryxdesign/core/i18n";
import { useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { GuardianGate, KidIllustration, KidPageHeader, KidState } from ".";

const styles = stylex.create({
  page: {
    marginInline: "auto",
  },
});

export function KidGuardianPage() {
  const t = useTranslator();
  const [isConfirmed, setIsConfirmed] = useState(false);

  return (
    <Stack gap={8} width="100%" maxWidth={900} xstyle={styles.page}>
      <KidPageHeader
        title={t("agentdock.guardian.title")}
        description={t("agentdock.guardian.description")}
        illustration={<KidIllustration kind="guardian" size={160} />}
      />

      <Card elevation="low">
        <Stack gap={5}>
          <Heading level={2}>{t("agentdock.guardian.privacyTitle")}</Heading>
          <Text type="body" color="secondary">
            {t("agentdock.guardian.privacyDescription")}
          </Text>
          <GuardianGate
            triggerLabel={t("agentdock.guardian.trigger")}
            title={t("agentdock.guardian.dialogTitle")}
            description={t("agentdock.guardian.dialogDescription")}
            cancelLabel={t("agentdock.guardian.cancel")}
            confirmLabel={t("agentdock.guardian.confirm")}
            onConfirm={() => setIsConfirmed(true)}
          />
        </Stack>
      </Card>

      {isConfirmed ? (
        <KidState
          kind="success"
          title={t("agentdock.guardian.confirmed")}
          description={t("agentdock.guardian.privacyDescription")}
        />
      ) : (
        <KidState
          kind="permission"
          title={t("agentdock.states.permission")}
          description={t("agentdock.states.permissionDescription")}
        />
      )}
    </Stack>
  );
}
