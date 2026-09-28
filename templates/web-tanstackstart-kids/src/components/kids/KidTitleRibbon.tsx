import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";

interface KidTitleRibbonProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly level?: 1 | 2 | 3;
  readonly action?: ReactNode;
}

const styles = stylex.create({
  frame: {
    position: "relative",
    isolation: "isolate",
    maxWidth: "100%",
  },
  cloud: {
    position: "absolute",
    zIndex: -1,
    insetBlockStart: "-14px",
    insetInlineStart: "-18px",
    width: "calc(100% + 36px)",
    height: "calc(100% + 28px)",
    pointerEvents: "none",
  },
  cloudShape: {
    fill: "var(--color-background-card)",
    stroke: "var(--color-border-emphasized)",
    strokeWidth: 2,
  },
  ribbon: {
    display: "inline-flex",
    alignItems: "center",
    gap: "var(--spacing-2)",
    flexWrap: "wrap",
    maxWidth: "100%",
    paddingInline: "var(--spacing-4)",
    paddingBlock: "var(--spacing-2)",
    backgroundColor: "var(--color-background-yellow)",
    borderColor: "var(--color-border-yellow)",
    borderRadius: "var(--radius-full)",
    borderStyle: "solid",
    borderWidth: "2px",
    boxShadow: "0 3px 0 var(--color-border)",
  },
  copy: {
    display: "grid",
    gap: "var(--spacing-1)",
    minWidth: 0,
  },
  subtitle: {
    maxWidth: "52ch",
  },
  heading: {
    margin: 0,
    minWidth: 0,
  },
  action: {
    marginInlineStart: "auto",
    "@media (max-width: 520px)": {
      flexBasis: "100%",
      marginInlineStart: 0,
      marginBlockStart: "var(--spacing-3)",
    },
  },
});

export function KidTitleRibbon({ title, subtitle, level = 2, action }: KidTitleRibbonProps) {
  return (
    <div {...stylex.props(styles.frame)}>
      <svg
        {...stylex.props(styles.cloud)}
        viewBox="0 0 320 108"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          {...stylex.props(styles.cloudShape)}
          d="M32 74c-20 0-28-22-14-36 10-11 28-10 37 1 5-18 22-29 41-24 8-17 28-23 45-13 13-12 35-8 43 9 20-9 43 8 40 30-2 20-18 33-39 33H32Z"
        />
      </svg>
      <div {...stylex.props(styles.ribbon)}>
        <span {...stylex.props(styles.copy)}>
          <Heading level={level} xstyle={styles.heading}>
            {title}
          </Heading>
          {subtitle ? (
            <Text type="supporting" color="secondary" xstyle={styles.subtitle}>
              {subtitle}
            </Text>
          ) : null}
        </span>
        {action ? <span {...stylex.props(styles.action)}>{action}</span> : null}
      </div>
    </div>
  );
}
