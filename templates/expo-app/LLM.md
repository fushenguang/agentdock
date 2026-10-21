# Agent Implementation Guide

## Golden path

1. Define or update typed contracts in `src/core/agent`.
2. Add behavior behind a pure function or driver adapter.
3. Render only validated `agent_result` envelopes through `ResultCanvas`.
4. Persist through `src/core/data` contracts and `src/infra/sqlite`.
5. Update route/action/test-id maps and the relevant documentation.
6. Run `pnpm check`.

## Boundaries

```text
components → core contracts → driver/infra implementations
```

Never let a React component parse raw model output, call a tool directly, or open SQLite itself.

## Structured output

`structuredOutputGate` accepts provider output, extracts a JSON envelope, validates it with Zod,
applies revive-only repairs, and issues at most three targeted retries. Exhaustion returns
`structured_output_retries_exhausted`. Add provider-specific native structured-output support in the
driver; do not add prose fallback to the gate.

## Provider driver

`createConfiguredDriver` uses the OpenAI-compatible driver only when both the public base URL and
model are present; otherwise it returns the deterministic reference driver. Keep provider transport in
`openAICompatibleDriver.ts`, keep validation in the gate, and keep env/transport injection available
for tests. A public API key is development-only and release builds must fail if one is configured.

## Tools and permissions

Register tools with a stable id, input schema, risk level, and executor. Protected tools call the
permission broker and append an audit event. The permission decision is part of the turn record; it is
never a UI-only boolean.

## Data

Migrations are append-only. Use repository contracts for sessions, events, memory projections,
permission decisions, and outbox operations. Remote mutations are written as idempotent outbox records
before any network attempt.

## OpenUI

Only `src/components/agent/openuiLibrary.tsx` and `ResultCanvas` may import OpenUI. If the current
OpenUI release is incompatible with Expo 57, isolate or replace the adapter there; do not downgrade
Expo. Keep the native component vocabulary intentionally small and documented.

`@openuidev/lang-core` has an install-time telemetry script. Keep it out of
`pnpm.onlyBuiltDependencies`; users who want that telemetry can opt in themselves.
