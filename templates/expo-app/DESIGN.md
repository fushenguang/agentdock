# Mobile Design Contract

## Stance

Mobile is the primary AI entry for many TheFoolAI users. The interface is calm, spacious, high-density
when information matters, and voice-first without hiding text access. Minimalism does not mean
monochrome: use a light neutral base, the current domain's accent, semantic state colors, and one fixed
chart palette.

## Two layers

```text
Upper layer: Agent voice orb → BottomSheet → process + structured result
Lower layer: Domain workspace → domain desktop / history & tasks
```

The workspace dock is one horizontally centered row:

1. Drawer entry.
2. Multi-desktop indicator.
3. New session entry.

The left drawer entry is icon-only. The drawer enters from the left: domain selection and session
history search stay at the top, the session list fills the remaining height, and the user entry is
fixed at the bottom. The drawer's leading edge remains aligned with the screen's left edge. Opening
the drawer automatically closes an expanded agent sheet.

There are only two primary work surfaces: Domain Desktop and History & Tasks. Swipe horizontally (or
use the page indicator) to move between them. Search is an overlay. Profile, privacy, storage, sync,
notifications, and about are secondary `/user/**` routes.

## Agent panel

The agent session sheet is a fixed 80% of screen height. It relies on the system grab handle rather
than drawing a duplicate. Its prompt composer is docked to the bottom; the input has a two-row
minimum, embeds the microphone and circular send arrow inside its container, and the area above it
scrolls independently through execution state, the collapsed process, and the validated result. Do
not add a persistent panel title, provider identity block, or event-count block.

Process events are collapsed by default. Execution state is always visible: after three seconds show
the stage; after ten seconds also show elapsed time and step count; always expose expandable process
and cancel while a turn is active.

Interface language defaults to Simplified Chinese. User profile settings can switch between Chinese
and English; the choice persists locally and flows into speech recognition and provider output.

## Structured results

Result transport is an `agent_result` envelope, but users see real content rather than JSON. A simple
conversational answer uses the validated `text` kind and a native Text component. Cards, metrics,
tables, charts, and OpenUI-native components are for content where that structure genuinely helps. A
validation failure is a first-class error state, not a fallback to unvalidated text.

## Agent rules for UI changes

- Use NativeWind utility classes and source-owned primitives before adding a dependency.
- Reserve `@expo/ui` for native controls where platform behavior clearly wins.
- Preserve stable test ids and update `agent/testids.json`.
- Every actionable state needs a visible control; do not communicate progress through color alone.
- Keep user-facing copy short and specific; details belong in a secondary route or disclosure.
