/**
 * The application shell.
 *
 * The Web is embedded in the TheFoolAI App's **right-hand panel** and is the auxiliary workbench of
 * the App's coding agent: the panel is the design target (default ~380px, hard minimum 360px), width
 * is the scarcest resource, and mouse + keyboard are the normal input. So:
 *
 * 1. **Width is measured by the container, not the viewport.** The shell root is a
 *    `container-type: inline-size` container and everything inside branches on `@container` queries,
 *    which stay correct whether the Web is a native view, an iframe, or a split pane.
 * 2. **No top bar.** Navigation is the bottom pill (`BottomNav`) and global preference lives on the
 *    settings route, so no page spends a row of panel height repeating the shell.
 * 3. **Vertical first, density follows the width.** Narrow containers use 12px inline padding with a
 *    16px section gap, ≥420px uses 20px/24px; the bottom reserves only the real height of the
 *    floating navigation.
 *
 * Height stays viewport-relative (`100dvh`, not a container query) because the host gives this Web its
 * own viewport — the panel *is* the viewport of the embedded view, so `100dvh` is the panel height.
 * Two numbers follow from that and must move together: the `4.5rem` reserved below for the floating
 * navigation, and `PageContainer`'s `isFullHeight` cap `calc(100dvh - 5.75rem)` (this reservation plus
 * the larger block-start step). Start a comment in the other file before changing either.
 */
import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

const styles = stylex.create({
  shell: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100dvh",
    backgroundColor: "var(--color-background-surface)",
    // Breakpoint container: every @container query below resolves against the panel width.
    containerType: "inline-size",
  },
  main: {
    flex: 1,
    /**
     * Content column: lets a "does not scroll" page (a full-height table, a one-screen skeleton) fill
     * `main`'s content box with `flex: 1; min-height: 0` — that box already excludes the padding below,
     * including the space reserved for the floating bottom navigation.
     */
    display: "flex",
    flexDirection: "column",
    width: "100%",
    paddingInline: "0.75rem",
    paddingBlockStart: "0.75rem",
    // Bottom navigation ≈44px + safe area + gap: reserve that much rather than a fixed 6rem.
    // Coupled with PageContainer's isFullHeight cap — see the doc comment above before changing it.
    paddingBlockEnd: "4.5rem",
    "@container (min-width: 420px)": {
      paddingInline: "1.25rem",
      paddingBlockStart: "1.25rem",
    },
    /** Printing: no shell padding; the page's own `@page` margins take over. */
    "@media print": { paddingInline: 0, paddingBlockStart: 0, paddingBlockEnd: 0 },
  },
});

interface TemplateShellProps {
  readonly children: ReactNode;
}

export function TemplateShell({ children }: TemplateShellProps) {
  return (
    <div {...stylex.props(styles.shell)}>
      <main {...stylex.props(styles.main)}>{children}</main>
      <BottomNav />
    </div>
  );
}
