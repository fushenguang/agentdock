import { Heading } from "@astryxdesign/core/Heading";
import { VisuallyHidden } from "@astryxdesign/core/VisuallyHidden";
import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import { PageContainer } from "./PageContainer";
import { PageTopBar } from "./PageTopBar";

/**
 * The **one-screen skeleton** shared by every second-level page:
 *
 * ```text
 * PageTopBar        ← the way back on the left, this page's actions on the right; does not scroll
 * ├─ fixed 32px ─┐
 * content container ← fills the remaining height; the **page itself does not scroll**, only this
 *                     container's body does
 * ```
 *
 * - **The 32px gap is owned here**: the top bar and the content share one flex column whose `gap` is
 *   `2rem`, so the distance never rides on `PageContainer`'s responsive 16/24px page gap.
 * - **At most one rounded frame**: `isFramed` (the default) draws one rounded, bordered card surface
 *   (the list-page look). When the body *is* the content, pass `isFramed={false}` to drop the frame —
 *   a card inside a card is an explicit anti-pattern.
 * - The page name goes to a `VisuallyHidden` `h1` (via `title`); the top bar does not repeat it.
 */
const styles = stylex.create({
  column: {
    display: "flex",
    flexDirection: "column",
    /** top bar ↔ content container: fixed 32px. */
    gap: "2rem",
    flex: 1,
    minHeight: 0,
    width: "100%",
  },
  frame: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
    width: "100%",
    overflow: "hidden",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "var(--color-border)",
    borderRadius: "var(--radius-container)",
    backgroundColor: "var(--color-background-card)",
  },
  /** Scrollable body: the only place scrolling happens on a full-height page. */
  body: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    overflowY: "auto",
    overflowX: "hidden",
    padding: "1rem",
  },
});

export interface PageShellProps {
  readonly title: string;
  readonly backHref: string;
  readonly backLabel: string;
  /** Right-hand side of the top bar: this page's actions (button group or page tabs). */
  readonly actions?: ReactNode;
  /** Drop the frame when the body is the content itself (keep full height and inner scrolling). */
  readonly isFramed?: boolean;
  readonly children: ReactNode;
}

export function PageShell({
  title,
  backHref,
  backLabel,
  actions,
  isFramed = true,
  children,
}: PageShellProps) {
  return (
    <PageContainer isFullHeight>
      <VisuallyHidden>
        <Heading level={1}>{title}</Heading>
      </VisuallyHidden>
      <div {...stylex.props(styles.column)}>
        <PageTopBar backHref={backHref} backLabel={backLabel}>
          {actions}
        </PageTopBar>
        {isFramed ? (
          <div {...stylex.props(styles.frame)}>
            <div {...stylex.props(styles.body)}>{children}</div>
          </div>
        ) : (
          <div {...stylex.props(styles.body)}>{children}</div>
        )}
      </div>
    </PageContainer>
  );
}
