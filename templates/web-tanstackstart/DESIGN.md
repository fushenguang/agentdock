---
status: draft # draft | approved
approvedBy: # the owner's name, set only on approval
approvedAt: # YYYY-MM-DD
archetype: # a row id from `astryx docs dock-style-archetypes`
theme:
  base: # an Astryx theme id
  brandColor: # for example oklch(0.62 0.12 160)
  modes: [light, dark]
---

# Design contract — {{PROJECT_NAME}}

Shared rules: `pnpm exec astryx docs dock-design-base`. Product facts: `PRODUCT.md`. This file holds
only what is specific to this product.

## Overview

Personality (three adjectives), audience, primary surfaces.

## Colors

The brand color and where it is used; any status colors beyond the theme's.

## Typography

Theme fonts kept or changed; scale adjustments.

## Layout and navigation

Phone: navigation, first screen, where the primary action sits.
Desktop: navigation, content width.

## Pages

| Route | Archetype | Purpose |
| ----- | --------- | ------- |

## Do and don't

Rules specific to this product.

## Delivery contract

The design is not accepted because the dev server renders or because elements exist in the DOM.
Acceptance requires the built application, the real App-hosted path, visible controls, successful
core interaction and phone/desktop review against this file. Canvas, chart and diagram output also
requires geometry and painted-pixel checks.

Use template provenance for every page. Preserve the archetype's frame, gap and padding; product
work goes inside its sections. When migrating an existing page, decide explicitly whether to keep
it, rebuild it from the matching archetype, or remove it rather than layering new styles on the old
structure.

## Decisions

Dated entries: what was chosen, what else was shown, and the owner's words.
