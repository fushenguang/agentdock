import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";

interface KidProgressProps {
  readonly label: string;
  readonly value: number;
  readonly max?: number;
  readonly encouragement?: string;
}

export function KidProgress({ label, value, max = 100, encouragement }: KidProgressProps) {
  return (
    <Stack gap={2}>
      <ProgressBar label={label} value={value} max={max} hasValueLabel />
      {encouragement ? (
        <Text type="supporting" color="secondary">
          {encouragement}
        </Text>
      ) : null}
    </Stack>
  );
}
