## 1. Implementation

- [x] 1.1 Remove the frame style and `isFramed` prop from `PageShell`; keep full-height layout and inner scroll
- [x] 1.2 Update every template call site and doc comment (`HelloWorkspace.tsx`, `PageTopBar.tsx`)
- [x] 1.3 Rewrite the `DESIGN.md` Skeleton rule; fix `LLM.md`, `AGENTS.md`
- [x] 1.4 Fix en/zh template docs (`index.mdx`, `usage.mdx`)
- [x] 1.5 Audit `web-tanstackstart-kids` for the same page-wrapper pattern and fix if present
- [x] 1.6 Reconcile the "framed content region" wording in `web-tanstackstart-ui-contract-adoption`
- [x] 1.7 Add a patch changeset for `@cogito.ai/cli`

## 2. Verification

- [x] 2.1 Run `pnpm format`, `pnpm lint`, `pnpm check-types`, template tests and build
- [x] 2.2 `openspec validate remove-web-tanstackstart-page-frame` and secret grep
