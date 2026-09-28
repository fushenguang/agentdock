import { Heading } from "@astryxdesign/core/Heading";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";

const styles = stylex.create({
  copy: {
    maxWidth: 720,
  },
});

interface KidPageHeaderProps {
  readonly title: string;
  readonly description?: string;
  readonly illustration?: ReactNode;
  readonly actions?: ReactNode;
}

export function KidPageHeader({ title, description, illustration, actions }: KidPageHeaderProps) {
  return (
    <Stack as="header" gap={4}>
      {illustration}
      <Stack gap={3} maxWidth={760}>
        <Heading level={1}>{title}</Heading>
        {description ? (
          <Text type="body" color="secondary" xstyle={styles.copy}>
            {description}
          </Text>
        ) : null}
      </Stack>
      {actions ? (
        <Stack direction="horizontal" gap={3} wrap="wrap">
          {actions}
        </Stack>
      ) : null}
    </Stack>
  );
}
