# Design — domain-package template readiness

## D1 · Pin the proven baseline

Move the template lock and registry minimum from `0.32.0` to `0.32.1`. The latter
contains the design-direction release plus strict page provenance checks against
the installed Astryx version.

## D2 · Encode observed failure modes

The generated workspace documentation must state:

- source reuse starts with a fixed commit and parity matrix; copying source is
  not proof of host or runtime compatibility;
- `pnpm dev`, unit tests and source checks are not delivery; the built package
  must start from its extracted artifact;
- UI work starts only after `DESIGN.md` is approved and is accepted through
  visible interactions at phone and desktop sizes, not DOM existence alone.
- Source copied into the generated Web must already satisfy that Web's
  formatter and strict TypeScript settings; a fresh scaffold is the proof, not
  a hand-fixed generated tree.
- Both the workspace and nested Web must expose the same inferred Claude Code
  skill links at the moment generation finishes.
- The template's declared minimum CLI and internal scaffold pin are one version
  fact and must move together.

## D3 · Release

The template pin and guidance are a backward-compatible CLI patch. Publish only
from merged main and verify registry `latest`, tarball integrity and generated
template metadata.
