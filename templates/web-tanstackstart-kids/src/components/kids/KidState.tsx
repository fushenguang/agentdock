import { EmptyState } from "@astryxdesign/core/EmptyState";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import type { ReactNode } from "react";
import { KidIllustration, type KidIllustrationKind } from "./KidIllustration";

export type KidStateKind =
  | "loading"
  | "empty"
  | "waiting"
  | "error"
  | "success"
  | "offline"
  | "permission";

const ILLUSTRATION_BY_KIND: Record<Exclude<KidStateKind, "loading">, KidIllustrationKind> = {
  empty: "empty",
  waiting: "waiting",
  error: "error",
  success: "success",
  offline: "waiting",
  permission: "guardian",
};

interface KidStateProps {
  readonly kind: KidStateKind;
  readonly title: string;
  readonly description?: string;
  readonly actions?: ReactNode;
  readonly isCompact?: boolean;
}

export function KidState({ kind, title, description, actions, isCompact = false }: KidStateProps) {
  if (kind === "loading") {
    return (
      <Stack gap={isCompact ? 3 : 4} hAlign="center" maxWidth={520}>
        <KidIllustration kind="waiting" />
        <Text type="large" weight="bold">
          {title}
        </Text>
        {description ? (
          <Text type="body" color="secondary">
            {description}
          </Text>
        ) : null}
        <ProgressBar label={title} isIndeterminate />
      </Stack>
    );
  }

  return (
    <EmptyState
      icon={<KidIllustration kind={ILLUSTRATION_BY_KIND[kind]} />}
      title={title}
      description={description}
      actions={actions}
      isCompact={isCompact}
    />
  );
}
