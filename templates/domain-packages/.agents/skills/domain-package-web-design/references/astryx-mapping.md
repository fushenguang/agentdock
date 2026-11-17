# Astryx mapping

Astryx owns the implementation surface. Use the installed CLI, not memory or another design system.

## Page archetypes

| Page job                          | Start from          |
| --------------------------------- | ------------------- |
| First-level index or module entry | `dock-landing`      |
| One-screen task/work area         | `dock-workbench`    |
| Homogeneous records               | `dock-list`         |
| Multi-step form                   | `dock-form-flow`    |
| Preferences and global settings   | `dock-settings`     |
| Canvas/editor frame               | `dock-editor-frame` |

Run `pnpm exec astryx build "<intent>"` and use the returned template. For an existing page, keep its
frame and adapt only the relevant sections.

## Component ownership

| Need                            | Prefer                                     |
| ------------------------------- | ------------------------------------------ |
| Page frame                      | `PageShell`, `PageTopBar`, `PageContainer` |
| Section rhythm                  | `Section`, `Divider`, `Stack`, `Grid`      |
| Dense records                   | `Table`                                    |
| Simple homogeneous rows         | `List`/`ListItem`                          |
| Independent destination/task    | `ClickableCard`, one level only            |
| Configuration or secondary form | `SideDrawer`                               |
| Rare row actions                | `MoreMenu`                                 |
| Small named choice set          | `SegmentedControl`                         |
| Larger choice set               | `Selector`                                 |
| Binary state                    | `Switch`                                   |
| Multi-select                    | `CheckboxList`                             |

Read the component docs before using unfamiliar props:

```bash
pnpm exec astryx component TextInput
pnpm exec astryx component Selector
pnpm exec astryx component Table
pnpm exec astryx docs dock-design-base
```

## Mapping output

Before implementation, write a compact mapping:

```text
Template: dock-workbench
Primary content: Section + current work area
Existing records: List
Configuration: SideDrawer
Primary action: Button in top bar
Hidden: history, diagnostics, advanced settings
Domain slot: <canvas/player/editor>
```

If the mapping cannot express the approved brief, stop and revise the brief rather than inventing a
parallel component system.
