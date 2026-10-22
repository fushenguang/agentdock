# Design: add-expo-app-template

## Product boundary

Mobile is a first-class Agent host, not a desktop projection. Basic create/read/continue behavior must
work locally; desktop/cloud are optional continuation and sync surfaces. The mobile runtime is still
an intentionally smaller Agent Core Lite:

| Concern      | Mobile boundary                         | Deliberate simplification                            |
| ------------ | --------------------------------------- | ---------------------------------------------------- |
| Turn runner  | `AgentTurnDriver` + explicit turn state | No desktop-scale orchestration graph                 |
| Context      | compact context envelope                | Summary-first; details are loaded on demand          |
| Memory       | ledger projection                       | Local read model, not the full desktop memory engine |
| Tools        | typed registry                          | Fewer tools, no package-owned tools                  |
| Permission   | broker + decision record                | One explicit approval path                           |
| Audit        | append-only local events                | No distributed audit coordinator                     |
| Verification | schema gate + retry budget              | Fail closed rather than speculative repair           |

Domain packages remain queryable Web/capability surfaces. They never own an LLM loop, context,
memory, tool policy, or permission decisions.

## Stack

| Layer           | Choice                                                | Consequence                                                     |
| --------------- | ----------------------------------------------------- | --------------------------------------------------------------- |
| Runtime         | Expo SDK 57.0.x, React Native 0.86.3, React 19.2.3    | Stable Rakazo-adjacent baseline; avoid SDK 58 churn             |
| Navigation      | Expo Router                                           | File routes and secondary user routes                           |
| Styling         | NativeWind 4.2.7 + Tailwind CSS 3                     | AI-agent-legible utility composition                            |
| Components      | Source-owned `react-native-reusables` primitives      | Copy-paste contract, not an npm runtime dependency              |
| Native controls | `@expo/ui` BottomSheet                                | Native sheet behavior where available                           |
| Results         | `@openuidev/react-lang` Renderer adapter              | High-density structured/native rendering; SDK 57 spike required |
| Validation      | Zod internally, JSON Schema 2020-12 across boundaries | One typed boundary contract                                     |
| Persistence     | `expo-sqlite` + migrations + outbox                   | Mobile-first local session ledger                               |

## UI information architecture

```text
WorkspaceShell
├── WorkspaceDock: [drawer] [desktop indicator] [new session]
├── Primary surfaces: Domain Desktop | History & Tasks
├── Search overlay (not a desktop)
├── User routes: /user/** (secondary)
└── AgentVoiceOrb
    └── AgentBottomSheet: fixed 80% height → scrolled result/process → docked prompt composer
```

The workspace dock is a fixed full-width row. The drawer sits at its leading edge, new session sits
at its trailing edge, and the desktop indicator is horizontally centered. The drawer is the only home
for current domain, search, history, and user summary. Consolidating the dock keeps shortcuts and
desktop context in the same place while limiting primary surfaces to two.

The top-bar drawer entry is icon-only. The drawer enters from the left: a compact domain selector and
session-history search stay at the top, the session list occupies all flexible height, and the user
entry remains fixed at the bottom. Its leading edge stays aligned with the screen's left edge.
Opening the drawer closes an expanded agent BottomSheet first. The two primary workspaces are
horizontally pageable, with the route synchronized to the visible page.

Visual language is minimal but not monochrome: a light neutral base, one current-domain accent,
semantic state colors, and a fixed chart palette. Decoration that does not encode state is removed.

### Product visual system

The mobile brand system extends TheFoolAI Electron's warm, healing palette: a soft off-white canvas,
near-black ink, amber `#D98D2D` as the primary action color, warm amber-tinted surfaces, and calm
violet/blue/green support colors for domain actions. A locally generated abstract artwork anchors the
Domain Desktop so first-run branding never depends on a remote image.

Expo modules are used where they materially improve perceived quality: `expo-blur` for the full-width
dock and glass cards, `expo-linear-gradient` for icon and orb depth, `expo-image` for the cached local
brand artwork, `expo-symbols` for native iOS icons, and `expo-haptics` for tactile state changes.
Android falls back to Lucide SVG icons and translucent surfaces rather than depending on SF Symbols.
Every page uses iconography, layered surfaces, and purposeful copy instead of bare text blocks.

Design references consulted for this pass:

- Rakazo's Expo app: production-shaped settings groups, glass navigation, native sheet composers,
  and mobile-first inbox/list behavior.
- UI/UX Pro Max: accessibility and touch-target guidance, semantic color tokens, icon rules, and
  pre-delivery checks.
- Expo SDK references: BlurView, Linear Gradient, Image, and Symbols.
- TheFoolAI Electron `src/renderer/index.css`: warm default theme and semantic token structure.

## Visual density refinements

The drawer omits section labels because its controls are self-describing, and search uses one
56-pixel container with the icon and input aligned in the same row. The workspace dock uses
transparent chrome so it floats over the brand backdrop rather than reading as a second header.
Detail cards and quick actions use horizontal icon-plus-title rows to reduce vertical stacking.
The user center provides an explicit Home control; secondary pages use native-feeling back behavior
with a safe `/user` fallback.

## Agent output pipeline

```text
LLM/provider output
  → envelope extraction (no arbitrary prose fallback)
  → Zod validation
  → deterministic revive-only repair (dates, numbers, null-like values)
  → actionable validation error + targeted retry (≤3)
  → optional second structuring model
  → explicit structured_output_retries_exhausted
  → ResultCanvas / OpenUI adapter
```

Repair may only revive a value without changing its meaning. Invalid content is surfaced as a typed
failure. The renderer accepts an `agent_result` envelope, not raw assistant prose.

The envelope is an application contract, not UI content. Conversational answers use the validated
`text` result kind and render as native text; metrics, tables, OpenUI, and action requests are
reserved for content that genuinely benefits from those structures. Envelope status, schema version,
and other transport metadata are not shown to the user.

Zustand is intentionally not introduced in this cut. Current runtime state is low-frequency and
scoped to language plus one active agent session; React Context, local refs, and SQLite cover those
boundaries without a new runtime dependency. Reconsider a store only when multiple independently
updating app domains need selective subscriptions or middleware.

Interface language starts at Simplified Chinese and can be switched to English from user profile
settings. The selection is persisted as a SQLite user preference, drives shell/agent/user copy and
speech recognition, and is passed to the provider as the preferred user-facing locale.

## Active session lifecycle

One in-memory active session represents the current interaction. Collapsing and reopening the sheet
reuses it, and completed user/assistant turns are retained as compact context for the next provider
request. The explicit new-session action is the only user-initiated way to rotate a session while one
is active.

If no active session exists, opening or submitting creates one automatically. If the sheet remains
collapsed for more than five minutes, the active in-memory session is cleared and the next opening
starts a fresh one; persisted history remains untouched. Automatic rotation for repeated-compaction
quality loss is intentionally reserved as a future context-quality evaluator, analogous to
longer-running coding-agent session management.

## Development provider boundary

The default driver remains the deterministic local reference driver. When
`EXPO_PUBLIC_AGENT_BASE_URL` and `EXPO_PUBLIC_AGENT_MODEL` are present, the template creates an
OpenAI-compatible chat-completions driver for development acceptance. The base URL must be HTTPS,
except for an explicit localhost development proxy, and must not carry credentials, a query, or a
fragment. `EXPO_PUBLIC_AGENT_API_KEY` is read only in development because Expo public values are
embedded in release bundles; production builds fail before bundling when it is present and production
traffic must use an authenticated server-side proxy.

The driver owns only transport and provider-message shaping. It does not validate or render output:
every response still passes through the structured-output gate. Network transport, environment, and
development mode are injectable so repository tests can exercise endpoint normalization, headers,
request shape, content extraction, cancellation, timeout, and the no-secret production behavior
without a real provider or device.

## Data boundary

The first migration stores sessions, session events, memory projections, permission decisions, and
outbox records. SQLite code stays behind `src/core/data` contracts so a later sync implementation can
replace the mobile adapter without changing Agent Core Lite. Every remote mutation is represented as
an idempotent outbox operation before the network is involved.

## OpenUI compatibility strategy

`ResultCanvas` owns the only OpenUI import and native component library. If the current package fails
against Expo 57, the adapter can be replaced or feature-flagged without spreading OpenUI types through
Agent Core or shell code. Downgrading Expo is not an option.

Spike result (2026-10-21): `@openuidev/react-lang@1.0.1` resolves through its React Native export,
passes strict TypeScript with Expo 57.0.30 / React Native 0.86.3, and is included in a successful iOS
Hermes `expo export` bundle. Native device smoke testing remains part of the generated project's next
product iteration, not a template-publishing gate.
