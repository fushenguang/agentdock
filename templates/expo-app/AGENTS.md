# Agent Execution Boundary — {{PROJECT_NAME}}

## Read first

Read `DESIGN.md` before UI work and `LLM.md` before Agent Core, data, or result-rendering work.

## Mobile ownership

This app is a first-class mobile Agent host. Agent Core Lite owns the turn loop, context envelope,
memory projection, tool registry, permission broker, audit trail, and structured-output verification.
Domain packages expose routes, summaries, and agent-safe actions; they never own an LLM loop.

## May execute autonomously

- `pnpm install`, `pnpm start`, `pnpm check`
- Edit files under `app/`, `src/`, `agent/`, and the root project documentation
- Add or update tests and run focused checks

## Must pause and confirm

- Any push, release, or native-store operation
- Adding or changing runtime dependencies
- Changing Expo SDK, React Native, React, NativeWind, or OpenUI versions
- Changing SQLite migrations after a database has shipped
- Replacing the permission broker or weakening structured-output failure behavior

## Prohibited

- Writing real secrets or production API keys
- Importing a data adapter outside `src/core/data` or `src/infra`
- Rendering arbitrary model prose as an `agent_result`
- Giving a domain package tool-policy or memory authority
- Bypassing hooks with `--no-verify`

## Synchronization rule

Whenever a route, primary action, or stable test id changes, update the matching file under `agent/`
in the same change.
