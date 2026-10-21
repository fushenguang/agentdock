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

The top bar has exactly two controls:

1. Left: drawer/domain entry.
2. Right: new session.

The drawer contains current domain, search, history, and user summary. There are only two primary work
surfaces: Domain Desktop and History & Tasks. Search is an overlay. Profile, privacy, storage, sync,
notifications, and about are secondary `/user/**` routes.

## Agent panel

Snap points are 25%, 50%, and 90%:

| Snap | Job                                                  |
| ---- | ---------------------------------------------------- |
| 25%  | voice input, current execution state, quick continue |
| 50%  | approval, focused task status, compact result        |
| 90%  | full high-density result and expandable process      |

Process events are collapsed by default. Execution state is always visible: after three seconds show
the stage; after ten seconds also show elapsed time and step count; always expose expandable process
and cancel while a turn is active.

## Structured results

Result content is an `agent_result` envelope. Use cards, metrics, tables, charts, and OpenUI-native
components instead of long prose. A validation failure is a first-class error state, not a fallback to
unvalidated text.

## Agent rules for UI changes

- Use NativeWind utility classes and source-owned primitives before adding a dependency.
- Reserve `@expo/ui` for native controls where platform behavior clearly wins.
- Preserve stable test ids and update `agent/testids.json`.
- Every actionable state needs a visible control; do not communicate progress through color alone.
- Keep user-facing copy short and specific; details belong in a secondary route or disclosure.
