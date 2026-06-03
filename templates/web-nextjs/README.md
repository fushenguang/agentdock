# {{PROJECT_NAME}}

> Generated from the [AgentDock](https://github.com/CogitoTech/agentdock) `web-nextjs` template.

Full-stack Next.js 16 starter with Supabase, i18n, Tailwind CSS and strict TypeScript.
Designed for both human developers and AI coding agents.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Language | [TypeScript 5+](https://www.typescriptlang.org) (strict mode) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Database / Auth | [Supabase](https://supabase.com) (`@supabase/ssr`) |
| i18n | [next-intl](https://next-intl.dev) (en / zh out of the box) |
| Testing | [Vitest](https://vitest.dev) |
| Package manager | [pnpm](https://pnpm.io) ≥ 9 |
| Runtime | Node.js ≥ 18 |
| Governance | [OpenSpec](https://github.com/fission-ai/openspec) (`@fission-ai/openspec`) |

## Directory Structure

```
src/
├── app/           # Next.js App Router — pages and layouts (per-locale)
├── core/          # Domain types + repository interfaces (no framework deps)
├── features/      # AI coding zone — one directory per feature
│   └── hello/     # Reference feature (copy this pattern)
├── infra/         # Supabase implementations (requires human review to edit)
│   └── db/        # Supabase client + repository implementations
└── i18n/          # next-intl configuration
messages/          # Translation files (en.json, zh.json)
openspec/          # Project governance — changes and specs
```

> **Four-layer contract** is enforced by ESLint Layer 2 rules.
> Features must not import from `infra/db` directly — use `core/repositories` interfaces.

## Getting Started

### 1. Prerequisites

- Node.js ≥ 18
- pnpm ≥ 9 — `npm install -g pnpm`
- A [Supabase](https://supabase.com) project (free tier works)

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your values:

| Variable | Where to find it |
|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API → anon / public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API → service_role (server only) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` for local dev |

### 4. Start development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development

### Common commands

```bash
pnpm dev          # Start dev server (http://localhost:3000)
pnpm build        # Production build
pnpm start        # Serve production build
pnpm test         # Run Vitest unit tests
pnpm check-types  # TypeScript type check (no emit)
pnpm lint         # ESLint (includes Layer 2 architectural rules)
```

### Adding a new feature

Features live in `src/features/`. Follow the reference implementation in `src/features/hello/`:

```
src/features/<your-feature>/
├── __contract__.ts   # Public API surface (required — export types and functions)
├── index.ts          # Re-exports from __contract__.ts
└── *.test.ts         # Vitest unit tests
```

Rules:
- Features import from `src/core/` (domain interfaces) — never from `src/infra/` directly.
- Every feature directory **must** have `__contract__.ts` (ESLint enforces this).
- Add translations to `messages/en.json` and `messages/zh.json`.

### Adding a language

1. Add locale to `src/i18n/routing.ts` and `middleware.ts`.
2. Create `messages/<locale>.json` with translated keys.

### Running tests

```bash
pnpm test              # Run all tests once
pnpm test --watch      # Watch mode
pnpm test --coverage   # With coverage report
```

## Deployment

### Vercel (recommended)

1. Push your project to GitHub.
2. Import the repository in [Vercel](https://vercel.com/new).
3. Add all environment variables from `.env.example` in **Project Settings → Environment Variables**.
4. Deploy — Vercel auto-detects Next.js.

### Docker / other platforms

```bash
pnpm build
pnpm start
```

Ensure all `NEXT_PUBLIC_*` variables are set at **build time** (they are inlined by Next.js).  
Server-only variables (`SUPABASE_SERVICE_ROLE_KEY`) must be available at **runtime**.

### Supabase: production checklist

- [ ] Enable Row Level Security (RLS) on all tables.
- [ ] Review and tighten RLS policies.
- [ ] Rotate the `service_role` key if it was ever exposed.
- [ ] Enable Supabase Auth email confirmation.

## Governance (OpenSpec)

This project uses [OpenSpec](https://github.com/fission-ai/openspec) for AI-assisted change governance.

```bash
openspec list              # List all changes
openspec status --change <name>   # Check change artifact status
openspec instructions apply --change <name>  # Get implementation instructions
```

Changes live in `openspec/changes/`. The four-gate builder workflow:

```
Human approves roadmap → Human reviews scope → AI codes → Machine gates (lint/types/tests)
```

See `openspec/config.yaml` for project-specific governance rules.

## Environment Variables Reference

| Variable | Required | Exposed to browser | Description |
|----------|----------|--------------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ | Supabase anon key (RLS protected) |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | ❌ | Admin key, bypasses RLS |
| `NEXT_PUBLIC_APP_URL` | Optional | ✅ | Canonical app URL |

> Variables prefixed with `NEXT_PUBLIC_` are bundled into client-side JavaScript.  
> Never put secrets in `NEXT_PUBLIC_*` variables.

## FAQs

**Q: pnpm install fails with `ERR_PNPM_FETCH_404` for `@cogito.ai/*`**  
A: The `@cogito.ai/tsconfig` and `@cogito.ai/eslint-config` packages must be published to npm before use. If you generated this project before the packages were published, run `pnpm install` again after they are live at [npmjs.com/@agentdock](https://www.npmjs.com/org/cogito.ai).

**Q: How do I add a new Supabase table?**  
A: Create the table in the Supabase Dashboard, then add a repository interface to `src/core/repositories/` and implement it in `src/infra/db/`. Do not call Supabase directly from `src/features/` — use the interface.

**Q: How do I disable i18n and use a single language?**  
A: Set a single locale in `src/i18n/routing.ts` and remove the `[locale]` segment handling in `middleware.ts`. Keep `messages/en.json` and remove unused locale files.

**Q: TypeScript is strict — how do I handle `!` assertions?**  
A: Prefer explicit checks (`if (!value) throw new Error(...)`) over `!` assertions. If you must use one, add a comment explaining why the value is guaranteed non-null.

**Q: Can AI agents work in this project?**  
A: Yes. See `AGENTS.md` for the autonomy boundary contract. AI agents may freely edit `src/features/` but must pause for human review before editing `src/infra/` or `middleware.ts`.

## Contributing

This project follows [Conventional Commits](https://www.conventionalcommits.org):

```
feat(hello): add greeting animation
fix(i18n): correct zh translation key
chore: update dependencies
```

## License

MIT
