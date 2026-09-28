# Component Visual Layer

The child template keeps Astryx as the component, interaction, keyboard, focus, ARIA, SSR, and theme kernel. The phase-one and phase-two visual layers extend Astryx through semantic themes, supported component targets, `xstyle`, slots, and a small number of non-interactive wrappers.

## Astryx Ownership Map

| Child category      | Astryx owner                            | Extension boundary                                                                     |
| ------------------- | --------------------------------------- | -------------------------------------------------------------------------------------- |
| Button              | `Button`                                | Theme tokens and component targets; hard-bottom primary shadow is preserved.           |
| Checkbox            | `CheckboxInput`, `CheckboxList`         | Indicator, label, list shape, and state targets.                                       |
| Radio               | `RadioList`                             | Radio indicator, selected row, orientation, and size targets.                          |
| Switch              | `Switch`                                | Track, thumb, label, checked, and disabled targets.                                    |
| Input               | `TextInput`                             | Field, size, status, validation, clear, and focus behavior stay in Astryx.             |
| Select              | `Selector`                              | Trigger, popup, search, option row, selected, and disabled targets.                    |
| Tabs                | `TabList`, `Tab`                        | Strip, tab, selected indicator, overflow, and keyboard behavior stay in Astryx.        |
| Collapse            | `Collapsible`, `CollapsibleGroup`       | Trigger, content, density, divider, and state behavior stay in Astryx.                 |
| Tag                 | `Token`                                 | Shape, size, color, and removable-token behavior.                                      |
| Badge               | `Badge`                                 | Variant and label treatment.                                                           |
| Tooltip             | `Tooltip`                               | Surface styling only; hover, focus, touch, and dismissal stay in Astryx.               |
| Toast               | `Toast`, `ToastViewport`, `useToast`    | Card target and localized demo content; live region and timing stay in Astryx.         |
| Skeleton/Loading    | `Skeleton`, `Spinner`, `ProgressBar`    | Visual targets and reduced-motion behavior.                                            |
| Empty/Error/Success | `EmptyState`, `FieldStatus`, `KidState` | Astryx semantics plus localized child copy and illustration.                           |
| Title ribbon/cloud  | `KidTitleRibbon`                        | Non-interactive first-party wrapper around Astryx `Heading` and `Text`.                |
| Background/Pattern  | `KidBackground`                         | Non-interactive first-party surface around ordinary content.                           |
| Divider             | `Divider`                               | Line and label theme targets.                                                          |
| Modal/Dialog        | `Dialog`, `DialogHeader`                | Surface styling only; modal semantics and focus stay in Astryx.                        |
| Carousel            | `Carousel`                              | Root, scroller, edge fade, and navigation styling; scrolling behavior stays in Astryx. |

## Phase-Two Ownership Map

| Phase-two category | Astryx owner                                | Extension boundary                                                           |
| ------------------ | ------------------------------------------- | ---------------------------------------------------------------------------- |
| Card               | `Card`                                      | Container styling and elevations.                                            |
| Progress           | `ProgressBar`, `KidProgress`                | Track/fill styling and effort-oriented copy.                                 |
| Form               | `FormLayout`, `Field`-based Astryx controls | Layout and examples only; no custom form engine.                             |
| Date/time          | `DateInput`, `TimeInput`, `Timestamp`       | Astryx picker/parsing behavior; local demo copy avoids birth-date semantics. |
| Table              | `Table`                                     | Header/body/row/cell targets; table semantics remain Astryx-owned.           |
| Pagination         | `Pagination`                                | Button/label styling; navigation behavior remains Astryx-owned.              |
| File/image         | `FileInput`, `Thumbnail`, `Lightbox`        | Local-only demos; no upload, persistence, or tracking.                       |
| Sheet/drawer       | `BottomSheet`                               | Surface styling; Astryx owns modality, focus, and dismissal.                 |
| Code               | `CodeBlock`, `Code`                         | Optional Creator-facing surface and syntax tokens.                           |

## Deliberate Exclusions

The template does not add `Cursor`, `Countdown`, or `Typewriter` as default components. Global cursor replacement, countdown pressure, and typewriter motion conflict with accessibility, reduced-motion, or child-safety goals. `BackTop` and page `Footer` remain product-level layout patterns unless a concrete product need is documented.

## Rules

- Prefer theme generation and semantic Astryx tokens before wrappers.
- Use a wrapper only when the need is decorative, compositional, or layout-specific.
- Never reimplement focus, keyboard, selection, validation, dialog, toast, announcement, or overlay behavior.
- Use stable Astryx theme targets and public CSS variables only. Do not target private `--_` variables.
- Do not edit generated theme `.css`, `.js`, `.d.ts`, or `.variants.d.ts` files by hand.
- Keep user-facing copy in every locale catalog.
- Keep motion optional and compatible with `prefers-reduced-motion`.
- Do not import or copy `animal-island-ui`, `naive-icons`, or historical third-party assets.

## Source References

The design and implementation reviewed the local source references at:

- `/Users/sunny/.codex/references/animal-island-ui`
- `/Users/sunny/.codex/references/naive-icons`
- Astryx 0.6 component source, CLI component docs, theme targets, tokens, and official documentation

These references informed abstract principles only: warm paper surfaces, rounded geometry, restrained depth, simple friendly strokes, and calm states. They are not runtime dependencies and their source or assets must not be copied.

## Verification

The component showcase is available at `/$locale/components`. It provides:

- localized demos for every phase-one and phase-two component;
- advanced showcase at `/$locale/advanced-components`;
- stable section test IDs for visual regression;
- unit and keyboard tests for controlled behavior and wrappers;
- axe coverage across three age profiles, two locales, and light/dusk;
- per-component Playwright snapshots across all profiles and both light/dark modes;
- reduced-motion assertions for the skeleton and carousel.
