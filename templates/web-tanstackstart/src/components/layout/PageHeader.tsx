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

interface PageHeaderProps {
  readonly title: string;
  readonly description: string;
  readonly actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <Stack as="header" gap={3}>
      <Heading level={1}>{title}</Heading>
      <Text type="body" color="secondary" xstyle={styles.copy}>
        {description}
      </Text>
      {actions ? (
        <Stack direction="horizontal" gap={3} wrap="wrap">
          {actions}
        </Stack>
      ) : null}
    </Stack>
  );
}
