---
roadmap-id: expo-app-template
---

# Proposal: add-expo-app-template

## Why

TheFoolAI serves users whose primary — often only — capable AI device is a modern phone. A desktop
thin-client projection would leave those users without usable offline-first access, while copying the
desktop Agent Core wholesale would make the mobile boundary too heavy and unsafe.

The first version therefore needs a TheFoolAI-specific Expo template: a first-class mobile Agent host
with a simplified local Agent Core boundary, voice-first interaction, structured result rendering, and
local persistence. Generalization to other products is deliberately deferred.

## What Changes

1. Add the `expo-app` template on Expo SDK 57, React Native 0.86, React 19, Expo Router,
   NativeWind 4, and source-owned `react-native-reusables` primitives.
2. Use `@expo/ui` as a targeted native-control supplement, starting with the agent BottomSheet.
3. Add a two-layer mobile UI contract:
   - the top layer is a floating voice agent orb and fixed-height 80% BottomSheet;
   - the lower layer is a two-entry shell: left domain/search/history/user drawer, right new-session
     action.
4. Limit primary work surfaces to Domain Desktop and History & Tasks. Search is an overlay, and user
   information is a secondary route group.
5. Add Agent Core Lite types and runtime boundaries for a turn runner, context envelope, memory
   ledger projection, typed tools, permission broker, audit trail, and verification/retry. Mobile owns
   this simplified local boundary; domain packages never own a second LLM loop.
6. Add a Zod/JSON Schema structured-output gate. It uses deterministic validation, revive-only repair,
   actionable retry, and explicit exhaustion; it never silently renders arbitrary free text as a
   result.
7. Add an OpenUI renderer adapter for high-density native results and an Expo 57 compatibility spike.
8. Add SQLite migration, session persistence, and sync-outbox boundaries inspired by the TheFoolAI
   Electron data layer but simplified for mobile.
9. Register the template in the CLI, add scaffolding tests, bilingual documentation, and a CLI
   changeset.
10. Add an OpenAI-compatible development provider driver with an explicit HTTPS/localhost boundary,
    injectable network transport for tests, and a production guard that refuses to embed a public API
    key in a release bundle.

## Capabilities

### New Capabilities

- `expo-app-template`: a mobile-first Expo Agent Host scaffold optimized for TheFoolAI.

### Modified Capabilities

- `cli-template-registry`: exposes the new standalone template and its SQLite data-layer default.

## Impact

- Adds `templates/expo-app`.
- Updates `packages/cli/src/registry.json` and CLI tests.
- Adds English and Simplified Chinese template documentation.
- Adds a `@cogito.ai/cli` minor changeset.

## Non-goals

- Do not replace the desktop App Agent Core or move authority over tool policy to domain packages.
- Do not make the template product-neutral in this first change.
- Do not implement cloud synchronization, account authentication, or production model routing; the
  OpenAI-compatible integration is for local development and authenticated proxy evaluation only.
- Do not depend on Mastra at runtime; its structured-output behavior is a design reference only.
- Do not downgrade Expo to match OpenUI's React Native example; incompatibility is handled behind the
  renderer adapter.
- Do not publish or push a release.
