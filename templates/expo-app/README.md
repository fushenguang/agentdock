# {{PROJECT_NAME}}

TheFoolAI-specific Expo mobile Agent Host. The template is deliberately product-specific for the first
version: mobile users get a local Agent Core Lite, voice-first panel, two-desktop workspace, structured
result rendering, and SQLite persistence before any generic abstraction is extracted.

## Stack

| Layer             | Choice                                                |
| ----------------- | ----------------------------------------------------- |
| Runtime           | Expo SDK 57, React Native 0.86.3, React 19.2.3        |
| Navigation        | Expo Router                                           |
| Styling           | NativeWind 4 + Tailwind CSS 3                         |
| Components        | Source-owned `react-native-reusables` primitives      |
| Native supplement | `@expo/ui` BottomSheet                                |
| Result rendering  | `@openuidev/react-lang` renderer adapter              |
| Validation        | Zod internally; JSON Schema 2020-12 across boundaries |
| Data              | `expo-sqlite` migrations and sync outbox              |

## Start

```bash
pnpm install
pnpm check
pnpm start
```

The reference driver works without an API key. Replace `src/core/agent/referenceDriver.ts` with a real
provider adapter when ready; do not bypass `structuredOutputGate`.

The OpenUI language-core postinstall script is not allowlisted. It only sends installation telemetry,
so it stays disabled under pnpm's build-script policy.

## Architecture

```text
app/               Expo Router routes
src/components     Shell, agent panel, and source-owned UI primitives
src/core/agent     Agent Core Lite: turn, context, tools, permissions, audit, output gate
src/core/data      Persistence and outbox contracts
src/infra          SQLite implementation
agent/             Machine-readable route, action, and test-id surfaces
```

See `DESIGN.md` for UI/UX rules and `LLM.md` for the implementation workflow.
