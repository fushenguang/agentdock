# Tasks — web-tanstackstart-acceptance-hardening

## 1. Template update

- [x] 1.1 Update template Astryx pins to 0.7.8 and `@cogito.ai/astryx-web` to 0.2.0; regenerate the
      standalone lockfile with the template's supported pnpm version.
- [x] 1.2 Refresh the generated Astryx guidance and sample page provenance markers.
- [x] 1.3 Move the domain-packages template and CLI registry pin from 0.29.0 to 0.32.0, updating
      the scaffold assertions with it.

## 2. Provenance gate

- [x] 2.1 Make `check-pages` fail when a page marker's Astryx version differs from the installed CLI.
- [x] 2.2 Add a negative test for a stale marker and keep the existing provenance tests green.

## 3. Verification and release

- [x] 3.1 Run template checks, OpenSpec strict validation, repository type checks, lint, format, and
      affected builds.
- [x] 3.2 Add a patch changeset and update template documentation/changelog where required.
- [ ] 3.3 Merge through a pull request with a merge commit and publish `@cogito.ai/cli` from main.
      Verify registry `latest`, tarball hash, and source commit; record release evidence.
