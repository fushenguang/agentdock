---
name: astryx-web-design
description: Use before any UI work in a web-tanstackstart project or a domain package Web. If DESIGN.md is not approved, hold the design-direction discussion with the owner (brand, UI style, UX, color system) and stop until they decide; otherwise create pages only with pnpm page:new and accept them at phone and desktop sizes.
---

# Astryx web design

| Situation                                                              | Read                                                      |
| ---------------------------------------------------------------------- | --------------------------------------------------------- |
| `DESIGN.md` says `status: draft` (new project, or no direction agreed) | `references/design-direction.md`, before any feature work |
| Adding or changing a page                                              | `references/page-building.md`                             |
| About to call UI work done                                             | `references/acceptance.md`                                |

Rules that never bend:

- No feature page before the owner approves the design direction. Never choose for the owner, never
  set a deadline, never fall back to a default.
- Every page comes from `pnpm page:new`. Never lay a page out from scratch.
- The shared rules are in `pnpm exec astryx docs dock-design-base`. Read the section you need
  instead of guessing.
- Screenshots are for judging what the user sees. Never use them to watch CI or progress.
