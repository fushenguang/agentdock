import { SelectableCard } from "@astryxdesign/core/SelectableCard";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import type { ReactNode } from "react";

interface KidChoiceProps {
  readonly label: string;
  readonly title: string;
  readonly description?: string;
  readonly icon?: ReactNode;
  readonly isSelected: boolean;
  readonly onSelect: () => void;
  readonly isDisabled?: boolean;
}

export function KidChoice({
  label,
  title,
  description,
  icon,
  isSelected,
  onSelect,
  isDisabled,
}: KidChoiceProps) {
  return (
    <SelectableCard
      label={label}
      isSelected={isSelected}
      onChange={() => onSelect()}
      isDisabled={isDisabled}
      elevation="low"
      padding={5}
      width="100%"
    >
      <Stack gap={2}>
        {icon}
        <Text type="body" weight="bold">
          {title}
        </Text>
        {description ? (
          <Text type="supporting" color="secondary">
            {description}
          </Text>
        ) : null}
      </Stack>
    </SelectableCard>
  );
}
