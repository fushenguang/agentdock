import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";

export type KidIconName =
  | "activity"
  | "arrow"
  | "check"
  | "circle"
  | "guardian"
  | "home"
  | "read"
  | "square"
  | "sun";

export type KidIconTone = "brown" | "mint" | "sun" | "coral" | "sky" | "leaf";

interface KidIconProps {
  readonly name: KidIconName;
  readonly size?: number;
  readonly title?: string;
}

interface KidIconBadgeProps {
  readonly name: KidIconName;
  readonly tone?: KidIconTone;
  readonly size?: number;
}

const styles = stylex.create({
  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    borderColor: "var(--color-border-emphasized)",
    borderRadius: "18px",
    borderStyle: "solid",
    borderWidth: "2px",
    boxShadow: "0 3px 0 rgba(92, 65, 37, 0.08)",
  },
});

const toneColor: Record<KidIconTone, string> = {
  brown: "var(--color-text-primary)",
  mint: "var(--color-accent)",
  sun: "var(--color-warning)",
  coral: "var(--color-error)",
  sky: "var(--color-icon-blue)",
  leaf: "var(--color-icon-green)",
};

const badgeBackground: Record<KidIconTone, string> = {
  brown: "var(--color-background-muted)",
  mint: "var(--color-accent-muted)",
  sun: "var(--color-warning-muted)",
  coral: "var(--color-error-muted)",
  sky: "var(--color-background-blue)",
  leaf: "var(--color-background-green)",
};

function Glyph({ name, size, title }: { name: KidIconName; size: number; title?: string }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 32 32",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    role: title ? ("img" as const) : undefined,
    "aria-label": title,
    "aria-hidden": title ? undefined : true,
  };

  if (name === "circle") {
    return (
      <svg {...common}>
        <circle cx="16" cy="16" r="10" fill="var(--color-background-teal)" />
        <circle cx="12.5" cy="14" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="19.5" cy="14" r="1.4" fill="currentColor" stroke="none" />
        <path d="M12 19.2c2.4 2.1 5.6 2.1 8 0" />
      </svg>
    );
  }

  if (name === "square") {
    return (
      <svg {...common}>
        <rect x="6.5" y="6.5" width="19" height="19" rx="6" fill="var(--color-background-yellow)" />
        <circle cx="12.5" cy="14" r="1.3" fill="currentColor" stroke="none" />
        <circle cx="19.5" cy="14" r="1.3" fill="currentColor" stroke="none" />
        <path d="M12 19c2.4 1.8 5.6 1.8 8 0" />
      </svg>
    );
  }

  if (name === "activity") {
    return (
      <svg {...common}>
        <path
          d="M8 22c5-1 8-4 9-10 4 1 7 4 8 9-5 4-11 5-17 1Z"
          fill="var(--color-background-green)"
        />
        <path d="M16 12c-1-4-4-7-8-8 0 5 2 9 8 12" fill="var(--color-background-teal)" />
        <circle cx="22" cy="9" r="3.5" fill="var(--color-warning)" />
      </svg>
    );
  }

  if (name === "guardian") {
    return (
      <svg {...common}>
        <path
          d="M16 5 26 9v8c0 6-4 10-10 13C10 27 6 23 6 17V9l10-4Z"
          fill="var(--color-background-yellow)"
        />
        <path d="M12 17.5 15 21l6-8" />
      </svg>
    );
  }

  if (name === "read") {
    return (
      <svg {...common}>
        <path d="M9 8h6v17H9a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4Z" fill="var(--color-background-blue)" />
        <path d="M15 8h8v17h-8" />
        <path d="M9 12h2M9 16h2" />
      </svg>
    );
  }

  if (name === "home") {
    return (
      <svg {...common}>
        <path d="m5 15 11-9 11 9v11H5V15Z" fill="var(--color-background-yellow)" />
        <path d="M12 26v-8h8v8" fill="var(--color-background-surface)" />
      </svg>
    );
  }

  if (name === "sun") {
    return (
      <svg {...common}>
        <circle cx="16" cy="16" r="6" fill="var(--color-warning)" />
        <path d="M16 4v3M16 25v3M4 16h3M25 16h3M7.5 7.5l2 2M22.5 7.5l-2 2M7.5 24.5l2-2M22.5 24.5l-2-2" />
      </svg>
    );
  }

  if (name === "check") {
    return (
      <svg {...common}>
        <circle cx="16" cy="16" r="11" fill="var(--color-success-muted)" />
        <path d="m10.5 16.5 3.5 3.5 8-9" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <circle cx="16" cy="16" r="11" fill="var(--color-accent-muted)" />
      <path d="M10 16h12M18 12l4 4-4 4" />
    </svg>
  );
}

export function KidIcon({ name, size = 28, title }: KidIconProps) {
  return <Glyph name={name} size={size} title={title} />;
}

export function KidIconBadge({ name, tone = "mint", size = 52 }: KidIconBadgeProps) {
  let content: ReactNode = <KidIcon name={name} size={Math.round(size * 0.58)} />;

  return (
    <span
      {...stylex.props(styles.badge)}
      style={{
        width: size,
        height: size,
        color: toneColor[tone],
        backgroundColor: badgeBackground[tone],
      }}
    >
      {content}
    </span>
  );
}
