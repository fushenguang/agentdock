## Context

See `proposal.md` for motivation and `specs/web-tanstackstart-kids-component-visuals/spec.md` for observable requirements.

The current template already has:

- three prebuilt Astryx themes extending a shared `kidsBaseTheme`;
- `Theme` mode switching for light/dark and a coarse age-profile provider;
- styled Astryx Button and ProgressBar corrections;
- first-party `KidIcon`, illustrations, cards, choice, progress, states, and read-along primitives;
- Vitest, Vitest axe, Playwright visual tests, Astryx boundary checks, and generated theme freshness checks.

The source review established these facts before implementation:

| Source | What was learned | What must not be copied |
| --- | --- | --- |
| `/Users/sunny/.codex/references/animal-island-ui` | Warm cream/ink palette, 2px borders, rounded controls, restrained hard-bottom shadows, pill geometry, paper/dot backgrounds, friendly state copy, and clear primary/secondary hierarchy. Component sources also show where its focus, ARIA, popup, and motion behavior is incomplete or package-specific. | No Less modules, assets, component structure, global cursor behavior, exact illustrations, fonts, or runtime dependency. |
| `/Users/sunny/.codex/references/naive-icons` | 48x48 rounded stroke language, simple filled geometric forms, dot eyes, and intentionally friendly asymmetry. | No SVG source, icon component, palette constant, or runtime dependency. `KidIcon` remains the original first-party registry. |
| Astryx 0.6 source, CLI docs, and theme template | Stable theme target names, public CSS variables, visual-prop/state keys, field/status composition, Astryx-owned focus/ARIA/dialog/toast/carousel behavior, and `defineTheme` component override syntax. | No `swizzle`, patched Astryx source, copied internal TSX, private `--_` variables, or duplicated interaction state machines. |

## Goals / Non-Goals

**Goals:**

- Turn the existing child theme into a coherent phase-one component visual system without changing Astryx's behavior ownership.
- Express most visual treatment through generated theme overrides and semantic tokens.
- Add only the first-party wrappers needed for visual patterns with no Astryx equivalent.
- Make profile, mode, locale, accessibility, reduced-motion, and visual evidence repeatable.
- Preserve the Button hard-bottom shadow, ProgressBar track/fill correction, and original `KidIcon` direction.

**Non-Goals:**

- Rebuilding Astryx controls or adding a second component interaction layer.
- Copying animal-island-ui source or assets into the template.
- Reproducing Nintendo or Animal Crossing visual identity.
- Expanding beyond the phase-one component list or changing profile persistence/data contracts.
- Treating screenshots as design evidence; screenshots are acceptance evidence only.

## Decisions

### 1. Use an explicit Astryx-to-child component mapping

The visual layer maps each phase-one category to the existing Astryx owner:

| Child category | Astryx owner | Visual strategy |
| --- | --- | --- |
| Button | `Button` | Theme overrides; preserve hard-bottom primary shadow and existing size behavior. |
| Checkbox | `CheckboxInput`, `CheckboxList` | Theme indicator/list targets; keep Astryx checked/indeterminate/disabled semantics. |
| Radio | `RadioList` | Theme radio indicator, selected row, orientation, and size targets. |
| Switch | `Switch` | Theme track, thumb, field, checked/disabled states. |
| Input | `TextInput` | Theme size/status/targets; use Astryx label, validation, clear, focus, and ARIA behavior. |
| Select | `Selector` | Theme trigger, option row, popup, search, selected and disabled states. |
| Tabs | `TabList`, `Tab` | Theme strip, tab, selected indicator, overflow target. |
| Collapse | `Collapsible`, `CollapsibleGroup` | Theme trigger/content/group density and separators. |
| Tag | `Token` | Theme color/size target; use Astryx removable-token behavior. |
| Badge | `Badge` | Theme variant target; semantic variants remain Astryx variants. |
| Tooltip | `Tooltip` | Theme surface; Astryx owns trigger, focus, touch, and dismissal behavior. |
| Toast | `Toast`, `useToast`, `ToastViewport` | Theme toast target and localized demo actions; Astryx owns live region, timing, and dismissal. |
| Skeleton/Loading | `Skeleton`, `Spinner`, `ProgressBar` | Theme skeleton/spinner/progress targets; reduced-motion policy remains global and theme-aware. |
| Empty/Error/Success states | `EmptyState`, `FieldStatus`, existing `KidState` | Wrap Astryx state components with localized copy and `KidIllustration`; no custom semantics. |
| Title ribbon/cloud | No Astryx equivalent | First-party decorative wrapper containing Astryx `Heading` or `Text`; no interactive behavior. |
| Background/Pattern | No Astryx equivalent | First-party decorative container using original CSS/SVG patterns; children remain normal Astryx content. |
| Divider | `Divider` | Theme line/label variants. |
| Modal/Dialog | `Dialog`, `DialogHeader` | Theme dialog/backdrop/targets; Astryx owns modal semantics and focus behavior. |
| Carousel | `Carousel` | Theme root/scroller/edge fade/navigation controls; Astryx owns scroll, snap, buttons, and keyboard behavior. |

Alternatives considered:

- **Reimplement all controls for a more exact visual match.** Rejected because it would duplicate Astryx behavior, increase a11y risk, and violate the kernel boundary.
- **Use only tokens and no component overrides.** Rejected because Astryx exposes stable component-specific targets for shapes, inner indicators, states, and public variables that semantic tokens cannot reach.
- **Swizzle Astryx components.** Rejected by the template's explicit prohibition and because generated theme output is SSR-safe.

### 2. Extend `kidsBaseTheme`, then only vary profile-specific dimensions

Shared child component styling belongs in `kids-base.ts`: borders, radii, surface treatments, indicator shapes, spacing, inner state targets, and reduced-motion-safe transitions. The `sprout`, `explorer`, and `creator` theme files keep width/height/density deltas already expressed through semantic capability values.

This prevents three copies of the same visual rule and keeps branch components from knowing which age profile is active.

### 3. Keep component overrides inside Astryx's supported contract

Overrides target documented stable classes such as `astryx-button`, `astryx-checkbox-indicator`, `astryx-radio-indicator`, `astryx-switch`, `astryx-text-input`, `astryx-selector-option-row`, `astryx-tab`, `astryx-collapsible-trigger`, `astryx-token`, `astryx-badge`, `astryx-tooltip`, `astryx-toast`, `astryx-skeleton`, `astryx-spinner`, `astryx-empty-state`, `astryx-divider`, `astryx-dialog`, and `astryx-carousel*`.

Rules:

- never target private `--_` variables;
- never override Astryx behavior or ARIA attributes;
- use `xstyle` only for composition/layout owned by a first-party wrapper;
- use `!important` nowhere;
- build generated `.css`, `.js`, `.d.ts`, and variants artifacts from source themes.

### 4. Add only two new visual wrappers for the phase

`KidTitleRibbon` and `KidBackground` are the only new wrappers required by the component list:

- `KidTitleRibbon` provides a decorative ribbon/cloud container and renders its title through Astryx typography.
- `KidBackground` is a non-interactive patterned surface that can host ordinary Astryx content.

The existing `KidState` and `KidIcon` are extended/reused rather than replaced. No wrapper owns keyboard, focus, validation, selection, dialog, toast, or carousel behavior.

### 5. Use one localized showcase plus component-level tests

Add a locale-prefixed component showcase route that renders all phase-one demos with stable section/test IDs. The route is the source for:

- unit tests that assert controlled states and wrapper semantics;
- axe tests across profile/mode/locale;
- visual snapshots per component at each profile and mode, while existing full-page snapshots continue to cover responsive locale/layout behavior;
- reduced-motion assertions for animated Astryx components.

This gives each component its own evidence without duplicating fragile interaction logic in the docs page.

### 6. Treat references as analysis, not implementation

The implementation uses observations from the reference sources only as abstract design direction: warm paper surfaces, soft geometry, dot/grid patterns, friendly stroke icons, and comfortable feedback. No reference source or asset is copied. The `assets:check` and `boundaries:check` scripts remain the enforcement point for forbidden packages and Astryx copies.

## Risks / Trade-offs

- [Astryx component target changes across a future upgrade] → Generated theme checks and component tests fail early; upgrade tasks must rerun `astryx theme build` and review the documented target table.
- [Broad component overrides accidentally reduce contrast or target size] → Keep shared overrides token-based, run contrast and axe checks in both modes, and snapshot all three profiles.
- [Visual snapshot count grows quickly] → Scope per-component snapshots to profile × mode at one stable desktop viewport; retain the existing locale × viewport full-page matrix for layout coverage.
- [A first-party decorative wrapper obscures semantics] → Keep wrappers non-interactive and test that headings/text remain Astryx-owned and accessible.
- [Reference-inspired decoration becomes too close to a third-party game] → Enforce provenance and originality checks, keep `KidIcon` first-party, and review copy/shape choices against the explicit non-goals.
- [Toast/Dialog tests become timing-flaky] → Prefer deterministic static toasts/inline dialog demos in unit/visual tests and leave timers/focus behavior to Astryx tests or controlled test props.

## Migration Plan

1. Extend the shared theme and regenerate all three theme artifacts.
2. Add wrappers, showcase copy, route, and i18n keys.
3. Add unit and axe coverage, then update/generate visual baselines using the repository's Playwright workflow.
4. Run the narrow template checks, then `pnpm check:full`.
5. Run `openspec validate expand-web-tanstackstart-kids-components --strict`.

Rollback is source-level: revert the theme/wrapper/showcase changes and regenerate theme artifacts. No data or persistence migration is involved.
