import { MobileNav } from "@astryxdesign/core/MobileNav";
import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";

/**
 * The right-hand drawer primitive shared by second-level pages.
 *
 * Astryx ships no general side sheet, so this borrows `MobileNav`'s (`side="end"`) skeleton: inside
 * it is a native `<dialog showModal>`, which brings the focus trap, the body scroll lock, the
 * `::backdrop` and top-layer stacking. Two interactions are fixed here rather than left to the
 * caller:
 *
 * - **No scrim**: `::backdrop` is made transparent — the thing beside the drawer is what you are
 *   looking at, and an editor must stay visible while it edits it;
 * - **An outside click does not close it**: only the drawer's own close control or Escape closes it,
 *   so a stray click cannot throw away a half-filled form.
 *
 * It is wider than the navigation default (420 rather than 320) so forms are not cramped, and it is
 * capped to the viewport, which makes it panel-wide on the narrow panel that is the normal case.
 */
const styles = stylex.create({
  /** Cancel `MobileNav` content's 8px padding and use the same 16px step as the page container. */
  body: {
    marginInline: "calc(-1 * var(--spacing-2))",
    marginBlock: "calc(-1 * var(--spacing-2))",
    paddingInline: "1rem",
    paddingBlock: "1rem",
  },
  noScrim: {
    "::backdrop": {
      backgroundColor: "transparent",
      backdropFilter: "none",
      opacity: 0,
    },
  },
});

export interface SideDrawerProps {
  readonly isOpen: boolean;
  readonly onOpenChange: (isOpen: boolean) => void;
  /** Accessible label (the dialog's `aria-label`). */
  readonly label: string;
  /** Visible header title in the drawer's top bar. */
  readonly header: string;
  readonly children: ReactNode;
}

export function SideDrawer({ isOpen, onOpenChange, label, header, children }: SideDrawerProps) {
  return (
    <MobileNav
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      side="end"
      width={420}
      xstyle={styles.noScrim}
      // Outside-click does not close: the backdrop area is the dialog itself, so preventDefault
      // makes MobileNav skip its own dismissal. Clicks inside the drawer target children, not the
      // dialog, so they are unaffected; Escape still closes.
      onClick={(event) => {
        if (event.target === event.currentTarget) event.preventDefault();
      }}
      label={label}
      header={header}
    >
      <div {...stylex.props(styles.body)}>{children}</div>
    </MobileNav>
  );
}
