import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";

export type KidIllustrationKind =
  | "welcome"
  | "activity"
  | "empty"
  | "waiting"
  | "error"
  | "success"
  | "guardian";

interface KidIllustrationProps {
  readonly kind: KidIllustrationKind;
  readonly title?: string;
  readonly size?: number;
}

const styles = stylex.create({
  frame: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  svg: {
    display: "block",
    overflow: "visible",
  },
});

function Frame({ children, size = 160 }: { children: ReactNode; size?: number }) {
  return (
    <span {...stylex.props(styles.frame)} style={{ width: size, height: size }}>
      {children}
    </span>
  );
}

function BaseSvg({ children, title, size }: { children: ReactNode; title?: string; size: number }) {
  return (
    <svg
      {...stylex.props(styles.svg)}
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : "true"}
      aria-label={title}
    >
      {children}
    </svg>
  );
}

export function KidIllustration({ kind, title, size = 160 }: KidIllustrationProps) {
  const common = {
    sun: <circle cx="112" cy="42" r="20" fill="var(--color-warning)" />,
    cloud: (
      <path
        d="M24 59c0-13 10-23 23-23 9 0 17 5 21 13 4-3 9-5 15-5 13 0 23 10 23 23H24Z"
        fill="var(--color-background-surface)"
        stroke="var(--color-border-emphasized)"
        strokeWidth="4"
      />
    ),
    leaf: (
      <path
        d="M31 102c0-29 21-50 61-57-4 39-17 61-45 67-5 1-10-3-16-10Z"
        fill="var(--color-background-green)"
        stroke="var(--color-border-green)"
        strokeWidth="4"
      />
    ),
    star: (
      <path
        d="m80 26 7 21 22 1-18 13 6 22-17-12-17 12 6-22-18-13 22-1 7-21Z"
        fill="var(--color-warning)"
        stroke="var(--color-border-yellow)"
        strokeWidth="4"
        strokeLinejoin="round"
      />
    ),
  };

  if (kind === "welcome") {
    return (
      <Frame size={size}>
        <BaseSvg title={title} size={size}>
          {common.sun}
          <path
            d="M19 122c15-22 36-33 61-33 25 0 46 11 61 33H19Z"
            fill="var(--color-background-green)"
            stroke="var(--color-border-green)"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <path
            d="M52 106h56"
            stroke="var(--color-border-green)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M73 45c0-11 8-20 19-20s19 9 19 20v8H73v-8Z"
            fill="var(--color-background-surface)"
            stroke="var(--color-border-emphasized)"
            strokeWidth="4"
          />
          <circle cx="85" cy="49" r="3" fill="var(--color-text-primary)" />
          <circle cx="99" cy="49" r="3" fill="var(--color-text-primary)" />
          <path
            d="M86 60c4 4 8 4 12 0"
            stroke="var(--color-text-primary)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </BaseSvg>
      </Frame>
    );
  }

  if (kind === "activity") {
    return (
      <Frame size={size}>
        <BaseSvg title={title} size={size}>
          {common.sun}
          <rect
            x="31"
            y="43"
            width="98"
            height="78"
            rx="22"
            fill="var(--color-background-surface)"
            stroke="var(--color-border-emphasized)"
            strokeWidth="5"
          />
          <path d="M48 67h64" stroke="var(--color-border)" strokeWidth="5" strokeLinecap="round" />
          <path d="M48 82h46" stroke="var(--color-border)" strokeWidth="5" strokeLinecap="round" />
          <path d="M48 97h32" stroke="var(--color-border)" strokeWidth="5" strokeLinecap="round" />
          {common.star}
        </BaseSvg>
      </Frame>
    );
  }

  if (kind === "waiting") {
    return (
      <Frame size={size}>
        <BaseSvg title={title} size={size}>
          {common.cloud}
          <circle cx="65" cy="95" r="10" fill="var(--color-accent)" />
          <circle cx="92" cy="95" r="10" fill="var(--color-accent)" opacity="0.7" />
          <circle cx="119" cy="95" r="10" fill="var(--color-accent)" opacity="0.4" />
        </BaseSvg>
      </Frame>
    );
  }

  if (kind === "error") {
    return (
      <Frame size={size}>
        <BaseSvg title={title} size={size}>
          <circle
            cx="80"
            cy="80"
            r="52"
            fill="var(--color-error-muted)"
            stroke="var(--color-border-red)"
            strokeWidth="5"
          />
          <path
            d="M62 62l36 36M98 62 62 98"
            stroke="var(--color-error)"
            strokeWidth="8"
            strokeLinecap="round"
          />
        </BaseSvg>
      </Frame>
    );
  }

  if (kind === "success") {
    return (
      <Frame size={size}>
        <BaseSvg title={title} size={size}>
          <circle
            cx="80"
            cy="80"
            r="52"
            fill="var(--color-success-muted)"
            stroke="var(--color-border-green)"
            strokeWidth="5"
          />
          <path
            d="m55 81 17 17 34-39"
            stroke="var(--color-success)"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {common.star}
        </BaseSvg>
      </Frame>
    );
  }

  if (kind === "guardian") {
    return (
      <Frame size={size}>
        <BaseSvg title={title} size={size}>
          <path
            d="M80 24 128 44v33c0 28-18 48-48 59-30-11-48-31-48-59V44l48-20Z"
            fill="var(--color-background-yellow)"
            stroke="var(--color-border-yellow)"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <path
            d="M62 80h36v25H62z"
            fill="var(--color-background-surface)"
            stroke="var(--color-text-primary)"
            strokeWidth="4"
          />
          <path
            d="M68 80v-9a12 12 0 0 1 24 0v9"
            stroke="var(--color-text-primary)"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </BaseSvg>
      </Frame>
    );
  }

  return (
    <Frame size={size}>
      <BaseSvg title={title} size={size}>
        {common.leaf}
        <path
          d="M83 45v68"
          stroke="var(--color-border-green)"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M82 66c-13-12-24-16-35-12 3 12 13 19 35 19M83 79c14-12 25-16 36-11-4 12-14 18-36 17"
          fill="var(--color-background-green)"
          stroke="var(--color-border-green)"
          strokeWidth="4"
        />
      </BaseSvg>
    </Frame>
  );
}
