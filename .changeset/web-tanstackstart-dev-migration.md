---
'@cogito.ai/cli': patch
---

Fix first-run `web-tanstackstart` SQLite projects: `pnpm dev` now applies pending SQLite migrations before Vite starts, while Supabase development startup skips automatic migration and prints the explicit `pnpm db:migrate:supabase` command.
