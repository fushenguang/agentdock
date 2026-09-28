import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";

export type KidBackgroundPattern = "dots" | "grid" | "hills" | "plain";

interface KidBackgroundProps {
  readonly pattern?: KidBackgroundPattern;
  readonly children: ReactNode;
}

const styles = stylex.create({
  surface: {
    position: "relative",
    isolation: "isolate",
    overflow: "hidden",
    minHeight: "100%",
    backgroundColor: "var(--color-background-body)",
  },
  dots: {
    backgroundImage:
      "radial-gradient(circle, color-mix(in srgb, var(--color-border-emphasized) 36%, transparent) 1.5px, transparent 1.5px), radial-gradient(circle, color-mix(in srgb, var(--color-border) 28%, transparent) 1px, transparent 1px)",
    backgroundPosition: "0 0, 12px 12px",
    backgroundSize: "32px 32px, 32px 32px",
  },
  grid: {
    backgroundImage:
      "linear-gradient(color-mix(in srgb, var(--color-border) 55%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--color-border) 55%, transparent) 1px, transparent 1px)",
    backgroundSize: "32px 32px",
  },
  hills: {
    backgroundImage:
      "radial-gradient(ellipse at 10% 100%, color-mix(in srgb, var(--color-success-muted) 85%, transparent) 0 34%, transparent 35%), radial-gradient(ellipse at 85% 112%, color-mix(in srgb, var(--color-accent-muted) 90%, transparent) 0 42%, transparent 43%), radial-gradient(ellipse at 48% 118%, color-mix(in srgb, var(--color-warning-muted) 80%, transparent) 0 36%, transparent 37%)",
    backgroundRepeat: "no-repeat",
  },
  content: {
    position: "relative",
    zIndex: 1,
  },
});

export function KidBackground({ pattern = "dots", children }: KidBackgroundProps) {
  return (
    <div
      {...stylex.props(
        styles.surface,
        pattern === "dots" && styles.dots,
        pattern === "grid" && styles.grid,
        pattern === "hills" && styles.hills,
      )}
    >
      <div {...stylex.props(styles.content)}>{children}</div>
    </div>
  );
}
