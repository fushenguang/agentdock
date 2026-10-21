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
├── TopBar: [drawer/domain] ... [new session]
├── Primary surfaces: Domain Desktop | History & Tasks
├── Search overlay (not a desktop)
├── User routes: /user/** (secondary)
└── AgentVoiceOrb
    └── AgentBottomSheet: 25% voice/status → 50% task/result → 90% full process/result
```

The top bar has exactly two entries. The drawer is the only home for current domain, search, history,
and user summary. This prevents shortcut-row inflation and keeps primary surfaces at two.

Visual language is minimal but not monochrome: a light neutral base, one current-domain accent,
semantic state colors, and a fixed chart palette. Decoration that does not encode state is removed.

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
