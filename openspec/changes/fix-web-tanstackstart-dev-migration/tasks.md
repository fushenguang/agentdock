## 1. Implementation

- [x] 1.1 Add the provider-aware development preparation script
- [x] 1.2 Wire `pnpm dev` through the preparation script without changing `pnpm start`
- [x] 1.3 Update template README and LLM migration guidance
- [x] 1.4 Add template configuration coverage for the dev bootstrap scripts

## 2. Verification

- [x] 2.1 Verify a fresh SQLite database is migrated through `pnpm dev:prepare`
- [x] 2.2 Verify Supabase mode skips automatic SQLite migration with a clear message
- [x] 2.3 Run template format, lint, type, test, and build gates
- [x] 2.4 Validate OpenSpec and secret checks
