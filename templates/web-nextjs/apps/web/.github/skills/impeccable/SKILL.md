# Impeccable Design Skill

> Skill for enforcing high-quality UI design and catching AI Slop in AI-generated code.

## Overview

Impeccable is a design quality assurance skill that helps AI Coding Agents produce refined, non-generic UI by enforcing design system constraints and catching common AI-generated anti-patterns.

## Commands

### `/impeccable init`

Initialize design context. Reads `DESIGN.md` and `PRODUCT.md` (if exists) to establish design baseline.

### `/impeccable craft <component>`

Generate a component following the design system in `DESIGN.md`. Uses semantic tokens, OKLCH colors, and mobile-first responsive patterns.

### `/impeccable critique <area>`

Review UI for design quality issues: spacing, color consistency, typography, contrast, accessibility.

### `/impeccable polish`

Apply spacing/typography/color fixes based on DESIGN.md constraints. Fixes minor inconsistencies.

### `/impeccable adapt`

Check and fix responsive behavior at 375px, 768px, and 1280px breakpoints.

## Installation

```bash
npx impeccable skills install
```

This creates `.github/skills/impeccable/` with this SKILL.md.

## Anti-Patterns Detected

1. Inter/Roboto font dominance
2. Purple-to-blue gradients
3. Nested rounded cards
4. Pure black/gray text
5. Bounce/elastic animations
6. Neon glowing header text
7. Icon tile above every heading

## CI Integration

```bash
npx impeccable detect src/ --fast --json
```

Run in CI to detect AI Slop. Returns JSON report with findings.
