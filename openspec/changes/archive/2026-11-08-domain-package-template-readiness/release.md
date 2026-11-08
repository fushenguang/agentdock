# Release record — domain-package template readiness

## Published versions

| Version  | Source / merge                                      | Tag                     | Release workflow | npm integrity                                                                                     |
| -------- | --------------------------------------------------- | ----------------------- | ---------------- | ------------------------------------------------------------------------------------------------- |
| `0.32.4` | PR #147, `2c614819af41ede6364976ab59fadc6361c833c3` | `@cogito.ai/cli@0.32.4` | `42463920311`    | `sha512-eKdvN/U1/AbJtj+8A6XHyKHJ+KXNMQKt5IgeCL508o6idppdC1OInvtKu+NdjXdMdIeNfh5QYNXZeAuLnQ+PfQ==` |
| `0.32.5` | PR #149, `425e59343343ee2486dee76704c7cd6a3cceafeb` | `@cogito.ai/cli@0.32.5` | `42465344232`    | `sha512-SnhOGElU5EHSWCC5dPQE0A5VaXH1XaAX8R1oZfPTIKiKuzfwWuuOLR9LT2MfqQNquFYE5bcqjVtbh5hW8GOQ1w==` |
| `0.32.6` | PR #152, `b9eceaa787211beaa38f77c9bed389bd0929dc20` | `@cogito.ai/cli@0.32.6` | `42467335796`    | `sha512-4ZyK+vfUK2r9ZGO2tsEa4opL7pOyNJ+w6pRLYK1pQkLEJ3k8G5yUVu4979KlYAHLzEqS36XGP7mUWoKK0pKR+A==` |
| `0.32.7` | PR #154, `1a6b2bc3cff1fc5b4d9a401c7353a199f9506d18` | `@cogito.ai/cli@0.32.7` | `42468210497`    | `sha512-NkhrB9+9QAcRsmXfcEYO3p7KpqtCHKrq6QBa7HG78vmpSH9C9Si1FdFwbzBjz16kAULE5bFhoy85BE3eastI7w==` |

All four versions are published on `registry.npmjs.org`; `latest` is `0.32.7`
and `npx --yes @cogito.ai/cli@0.32.7 --version` returns `0.32.7`.

## Source changes

- #142: generated workspace guidance for source reuse, dev/build parity and UI acceptance.
- #144: restore `.claude/skills` links after npm packaging.
- #146: refresh the generated standards lock.
- #148: strict generated Web Channel client, Web-formatted hosted runtime, and regression checks.
- #150: create nested Web skill links during scaffold.
- #151: install pinned Bun from npm instead of the flaky GitHub release download.
- #153: align `agentdock.minCliVersion` with the internal scaffold pin.

## Final acceptance

The final `0.32.7` cold start used a fresh `deepseek-flash` session. Its source
scaffold commit `f509872ee773e461a35c36d54b6ea4bcad3cdaa1` passed `verify` 6/6
without generated-source repair; the final docs-only commit was
`b3b2d3306f78de550c03dcb5b7896c8b660e01f1`. The verify summary sha256 is
`c5e6de19312f2d5a2342ccc7f2a3cc840f1f59748affe271793ac14e005d9a17`.

Final template facts:

- `standards-lock.json.agentdockCliVersion = 0.32.7`
- `package.json.agentdock.minCliVersion = 0.32.7`
- root and nested Web `.agents/skills` / `.claude/skills` name sets match
- generated Web formatter, lint and strict TypeScript pass on first scaffold
