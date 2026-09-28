# Mastra Integration

This optional integration adds a Mastra agent and deterministic workflow runtime to the TanStack Start server. It is server-only and does not change Astryx, the localized application routes, or the Drizzle/SQLite/Supabase provider contract.

## Endpoints

The Mastra adapter is mounted at `/api`. Useful development endpoints include:

- `GET /api/agents`
- `GET /api/workflows`
- `POST /api/agents/assistant-agent/generate`
- `POST /api/agents/assistant-agent/stream`

Agent generation and streaming require `OPENAI_API_KEY`. Starting the server, listing agents, and running the deterministic workflow do not.

## Environment

```dotenv
OPENAI_API_KEY=
MASTRA_MODEL=openai/gpt-5-mini
```

Never commit a real key. Replace the model selection through `MASTRA_MODEL` when using another supported model identifier.

## Authentication

`src/mastra/auth.ts` is a development-only allow hook. Replace it with a real session, token, identity-provider, or authorization check before exposing `/api` to a production network. The adapter route passes every HTTP method through that hook before Mastra handles the request.

## Runtime Boundaries

- Register agents in `src/mastra/index.ts`; this adapter does not perform file-based discovery.
- Keep tools deterministic and narrowly scoped. Application data access must continue through the template's existing feature/repository boundary.
- Do not add Mastra Memory, LibSQL, DuckDB, or observability storage merely to share persistence with the application.
- The default runtime keeps Mastra state in memory, so restart and multi-instance durability are not guaranteed.
- Do not add a second UI library or move child-facing interaction behavior out of Astryx.
- Do not store precise age, birth dates, child profiles, or other identifying child data through Mastra by default.

## Verification

```bash
pnpm test
pnpm check-types
pnpm build
pnpm start
```

Then request `/api/agents` and `/api/workflows` without a model key. A successful response proves the runtime and adapter wiring are available.
