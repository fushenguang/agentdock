import { Icon } from "@astryxdesign/core/Icon";
import { Link } from "@astryxdesign/core/Link";
import { Text } from "@astryxdesign/core/Text";
import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";

/**
 * The top bar of a second-level page: **two ends, one row** — on the left a circular back button
 * plus the back label, on the right that page's actions (a button group, or the page's tabs).
 *
 * The page name is not repeated here (it belongs in a visually hidden `h1`); only the way back and
 * the page's own controls are visible. The icon is a size smaller than the text and both are
 * vertically centred (`lineHeight: 1` removes the line box's asymmetric leading).
 *
 * The bar never scrolls: `PageShell` puts it and the content in one column and only the content
 * container scrolls, so the way back is always reachable.
 */
const styles = stylex.create({
  bar: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.75rem",
    width: "100%",
    flexShrink: 0,
    minWidth: 0,
  },
  back: {
    display: "inline-flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "6px",
    minWidth: 0,
    /** The back entry never shrinks: the label must not wrap. */
    flexShrink: 0,
    textDecoration: "none",
    color: "var(--color-text-secondary)",
  },
  backIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "1.5rem",
    height: "1.5rem",
    flexShrink: 0,
    borderRadius: "var(--radius-full)",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "var(--color-border)",
    color: "var(--color-text-primary)",
    backgroundColor: "var(--color-background-card)",
  },
  backLabel: {
    display: "inline-flex",
    alignItems: "center",
    lineHeight: 1,
    marginLeft: "6px",
  },
  /**
   * The actions area **may shrink** (`minWidth: 0`): when a page puts a `TabList` here, its four
   * tabs exceed the narrow panel's remaining width and the tab strip scrolls horizontally — which
   * only works if this container is actually allowed to narrow. A `ButtonGroup` is unaffected while
   * its content fits, and still aligns to the right when it does not.
   */
  actions: {
    display: "inline-flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "0.5rem",
    flexShrink: 1,
    minWidth: 0,
  },
});

interface PageTopBarProps {
  /** Back target (including the locale prefix). */
  readonly backHref: string;
  /** Back label (for example "返回" / "Back"). */
  readonly backLabel: string;
  /** Right-hand action group for this page. */
  readonly children?: ReactNode;
}

export function PageTopBar({ backHref, backLabel, children }: PageTopBarProps) {
  return (
    <div {...stylex.props(styles.bar)}>
      <Link href={backHref} xstyle={styles.back}>
        <span {...stylex.props(styles.backIcon)}>
          <Icon icon="chevronLeft" size="xsm" />
        </span>
        {/* No `maxLines`: it switches the label to a block box and drops it below the icon. */}
        <Text type="supporting" xstyle={styles.backLabel}>
          {backLabel}
        </Text>
      </Link>
      {children ? <div {...stylex.props(styles.actions)}>{children}</div> : null}
    </div>
  );
}
