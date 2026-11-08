# Design — web-tanstackstart-acceptance-hardening

## D1 · Version pin

Use Astryx 0.7.8, the version exercised by lean-flowkit through its final acceptance. Keep
`@cogito.ai/astryx-web` on the published 0.2.0 design-direction integration. Lockfile changes are
generated, not hand-edited.

## D2 · Provenance drift gate

`tools/check-pages.mjs` already verifies that component pages come from a known Astryx template. It
will also compare the marker's `astryx:` field with `astryx --version`. A mismatch fails with the
expected and found versions, so a dependency upgrade cannot silently leave stale template audit
metadata.

The pure checker accepts the installed version as an argument; the command obtains it from the same
Astryx binary used to list templates. Tests cover a stale marker without spawning external tools.

## D3 · Release

The behavior is a backward-compatible template hardening, so `@cogito.ai/cli` receives a patch
changeset. Publish only after this change is merged to main, then verify the registry version,
tarball integrity, and `npm view ... dist-tags`.
