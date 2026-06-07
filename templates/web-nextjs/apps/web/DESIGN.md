# AgentDock Web Template — Design System

> This document serves as the design context anchor for AI Coding Agents. Every UI generation must reference this file before producing components.

## Project Type & Design Positioning

- **Type**: SaaS starter template (B2B/B2C universal)
- **Style**: Clean / Professional / Modern
- **Philosophy**: Not minimal, not flashy. Purposeful, trustworthy, and easy to extend.

## Typography System

| Token            | Value                     | Usage                     |
| ---------------- | ------------------------- | ------------------------- |
| `--font-heading` | Geist Sans                | Headlines, hero text, nav |
| `--font-body`    | Geist Sans                | Body text, UI labels      |
| Fallback         | `system-ui`, `sans-serif` | Geist loading failure     |

- **Font scale**: `--text-xs` (0.75rem) → `--text-4xl` (2.25rem)
- **Hero title**: `clamp(2rem, 5vw + 1rem, 4rem)` — responsive, fluid
- **Body line-height**: 1.6 for readability

## Color Strategy (OKLCH)

Brand color is defined via OKLCH hue/chroma/lightness variables:

- `--color-brand-h: 262`, `--color-brand-c: 0.26`, `--color-brand-l: 0.56`
- Override these three variables to retheme the entire application.

### Semantic Tokens

| Token                      | Light            | Dark            | Usage                  |
| -------------------------- | ---------------- | --------------- | ---------------------- |
| `--color-surface`          | oklch(0.985 ...) | oklch(0.13 ...) | Page backgrounds       |
| `--color-surface-elevated` | oklch(1 ...)     | oklch(0.18 ...) | Cards, modals          |
| `--color-muted`            | oklch(0.94 ...)  | oklch(0.22 ...) | Secondary backgrounds  |
| `--color-muted-foreground` | oklch(0.52 ...)  | oklch(0.62 ...) | Placeholder, meta text |
| `--color-border`           | oklch(0.88 ...)  | oklch(0.28 ...) | Dividers, borders      |

## Spacing System

- **Baseline**: 4px (`--space-1`)
- **Section spacing**: `clamp(64px, 10vw, 120px)` — never hardcode section padding
- **Touch targets**: Minimum `44px x 44px` for all interactive elements

## 7 AI Slop Anti-Patterns (FORBIDDEN)

When generating or reviewing UI, the following patterns are **strictly forbidden**:

1. **Inter + Roboto font dominance** — Geist is the primary font. Do not fall back to Inter as the main font.
2. **Purple-to-blue gradients** — `from-purple-* to-blue-*` is banned. Use `--color-primary` or solid colors.
3. **Nested rounded cards** — Do not place `rounded-xl` cards inside `rounded-xl` cards. One level of radius is enough.
4. **Pure black / pure gray text** — All grays must carry a subtle hue (our neutrals are tinted).
5. **Bounce / elastic easing** — No `bounce`, `elastic`, or spring animations. Use `ease-out` or `cubic-bezier(0.4, 0, 0.2, 1)`.
6. **Neon glowing header text on dark backgrounds** — No text-shadow glow effects. Keep it clean.
7. **Icon tile above every heading** — Do not place a rounded square icon tile above every section heading. Use icon + heading inline or omit.

## Impeccable Workflow

When designing new pages or sections, follow this workflow:

1. **Craft** (`/impeccable craft`) — Generate initial design based on DESIGN.md context
2. **Critique** (`/impeccable critique`) — Review for spacing, color, typography consistency
3. **Polish** (`/impeccable polish`) — Fix spacing, font sizes, color values
4. **Adapt** (`/impeccable adapt`) — Ensure responsive at 375px / 768px / 1280px
