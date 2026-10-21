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

The deterministic reference driver works without provider configuration. For local acceptance with a
real OpenAI-compatible provider, copy `.env.example` to `.env.local` and set:

```bash
EXPO_PUBLIC_AGENT_BASE_URL=https://provider.example/v1
EXPO_PUBLIC_AGENT_MODEL=your-model
# Development builds only. Never commit this value.
EXPO_PUBLIC_AGENT_API_KEY=your-key
```

The base URL must use HTTPS (or an HTTP localhost proxy) and must not contain credentials, a query, or
a fragment. Missing base URL/model settings fall back to the reference driver. Every real provider
response still passes through `structuredOutputGate`; do not add a prose fallback.

`EXPO_PUBLIC_*` values are embedded in JavaScript bundles. `pnpm build` therefore fails if
`EXPO_PUBLIC_AGENT_API_KEY` is present. Production traffic must use an authenticated server-side proxy
and must never ship a provider key in the mobile bundle.

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
