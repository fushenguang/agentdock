import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";

/**
 * Page content container (the single width/rhythm owner for a page).
 *
 * - Always `width: 100%`: in a narrow panel (the normal ~380px case) there is no room for centred
 *   gutters;
 * - Section gap follows the **container** width (16px narrow / 24px from 420px);
 * - The width cap only applies once the container is ≥640px, and it is 44rem — not a fixed 1200px
 *   (which is unreachable inside the App panel). From 960px it relaxes to 56rem so a full-width
 *   browser row of cards still breathes; body text stays constrained by the card grid.
 *
 * Width is the scarcest resource in the embedded App panel, so every breakpoint here is a
 * `@container` query resolved against `TemplateShell`'s `container-type: inline-size` root.
 */
const styles = stylex.create({
  page: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    marginInline: "auto",
    gap: "1rem",
    "@container (min-width: 420px)": { gap: "1.5rem" },
    "@container (min-width: 640px)": { maxWidth: "44rem" },
    "@container (min-width: 960px)": { maxWidth: "56rem" },
  },
  /**
   * Full-height pages (for example the one-screen skeleton of a second-level page): fill the
   * remaining height of `main`'s content box (`TemplateShell.main` is a flex column) so the page
   * itself does not scroll and scrolling happens only inside the content container. Off by default.
   */
  fullHeight: {
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
    /**
     * `TemplateShell` is `min-height: 100dvh` (not a fixed height), so content taller than the
     * viewport is never compressed — a full-height page has to cap itself. The shell reserves
     * `4.5rem` for the bottom navigation plus `1.25rem` of `main` block-start padding (the larger
     * of the two density steps), so the cap is `100dvh - 5.75rem`. The narrow step is 8px taller
     * than the cap accounts for, which is acceptable.
     *
     * This number is coupled to `TemplateShell` (its `4.5rem` bottom reservation and its density
     * steps) — change them together.
     */
    maxHeight: "calc(100dvh - 5.75rem)",
  },
});

interface PageContainerProps {
  readonly children: ReactNode;
  /** Full-height pages: fill `main`'s remaining height (the page does not scroll; the inner container does). */
  readonly isFullHeight?: boolean;
}

export function PageContainer({ children, isFullHeight }: PageContainerProps) {
  return <div {...stylex.props(styles.page, isFullHeight && styles.fullHeight)}>{children}</div>;
}
