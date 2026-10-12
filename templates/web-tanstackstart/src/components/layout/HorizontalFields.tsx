import { FormLayout } from "@astryxdesign/core/FormLayout";
import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";

/**
 * A group of short-label fields: **label on the left, control on the right**.
 *
 * When a label is short (≤4 characters) and the control is a plain input, select or switch, two
 * stacked lines waste vertical space that the narrow panel cannot afford, so the label reads across.
 * Built on Astryx's `FormLayout direction="horizontal-labels"`.
 *
 * Only short labels with simple controls belong here: `TextArea`s and long labels stay stacked.
 *
 * The grid is `auto` for the label column and `minmax(0, 1fr)` for the control column: a bare `1fr`
 * lets the control's min-content push the label column into wrapping. Astryx collapses the layout
 * below a 480px **viewport**, and the panel is narrower than that most of the time, so the same grid
 * is re-applied below 480px of **container** — keyed to the panel like every other breakpoint here,
 * which also covers a narrow panel inside a wide desktop window. Grouped fields share one grid, so
 * their labels line up.
 */
const styles = stylex.create({
  group: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "auto minmax(0, 1fr)",
    gap: "0.75rem 1rem",
    alignItems: "start",
    /** Astryx collapses at a 480px viewport; re-apply the grid at a 480px container. */
    "@container (max-width: 480px)": {
      display: "grid",
      gridTemplateColumns: "auto minmax(0, 1fr)",
      gap: "0.75rem 1rem",
      alignItems: "start",
    },
  },
});

export function HorizontalFields({ children }: { readonly children: ReactNode }) {
  return (
    <FormLayout direction="horizontal-labels" xstyle={styles.group}>
      {children}
    </FormLayout>
  );
}
