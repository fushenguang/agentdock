import { Stack } from "@astryxdesign/core/Stack";
import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";

const styles = stylex.create({
  page: {
    marginInline: "auto",
  },
});

interface PageContainerProps {
  readonly children: ReactNode;
}

export function PageContainer({ children }: PageContainerProps) {
  return (
    <Stack gap={8} width="100%" maxWidth={1200} xstyle={styles.page}>
      {children}
    </Stack>
  );
}
