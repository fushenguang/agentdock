import { ClickableCard } from "@astryxdesign/core/ClickableCard";
import { Heading } from "@astryxdesign/core/Heading";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import type { ReactNode } from "react";

interface KidActionCardProps {
  readonly label: string;
  readonly title: string;
  readonly description?: string;
  readonly icon?: ReactNode;
  readonly href?: string;
  readonly onClick?: () => void;
  readonly isDisabled?: boolean;
}

export function KidActionCard({
  label,
  title,
  description,
  icon,
  href,
  onClick,
  isDisabled,
}: KidActionCardProps) {
  return (
    <ClickableCard
      label={label}
      href={href}
      onClick={onClick ? () => onClick() : undefined}
      isDisabled={isDisabled}
      elevation="low"
      padding={5}
      width="100%"
    >
      <Stack gap={3}>
        {icon}
        <Heading level={2}>{title}</Heading>
        {description ? (
          <Text type="body" color="secondary">
            {description}
          </Text>
        ) : null}
      </Stack>
    </ClickableCard>
  );
}
