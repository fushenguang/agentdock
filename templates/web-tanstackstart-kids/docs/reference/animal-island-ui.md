# animal-island-ui Reference Record

## Reviewed Source

- Repository: https://github.com/guokaigdg/animal-island-ui
- Reviewed commit: `29051196bd7586d4484b55431b03178e6046fa64`
- Version reviewed: `v2.0.0`
- License at review time: MIT
- Local reference clone used during design: `~/.codex/references/animal-island-ui`

This project is a design reference, not a runtime dependency. The child template must not import `animal-island-ui`, `naive-icons`, or any historical asset from the reference repository.

## Copyright And Remediation Context

Issue #57 documents a real Nintendo DMCA notice and remediation process. The maintainer removed disputed historical assets, rewrote repository history, removed old release tags, deprecated old npm versions, and republished clean versions. The current repository is useful as a study reference, but historical versions and forks may still contain disputed material.

Implications for this template:

- Use only original AgentDock design tokens, illustrations, copy, and code.
- Do not copy reference-project component implementations, historical visuals, fonts, images, or examples.
- Do not download or vendor assets from old releases, forks, screenshots, or cached packages.
- Record any future external asset with source, version, license, and redistribution evidence.

## Adopted Ideas

The child template intentionally adapts these principles without copying implementation:

1. A coherent design language with explicit rules instead of ad hoc cute styling.
2. Warm neutral surfaces, rounded geometry, and restrained 3D action depth.
3. Build-time tokens plus runtime CSS custom properties for theming.
4. Loading, empty, waiting, error, success, and reduced-motion states as first-class product states.
5. A design-system document and agent guidance that keep generated work aligned.
6. Automated accessibility smoke coverage and documentation freshness checks.

## Rejected Or Adapted Risks

The following upstream lessons led to different implementation choices:

1. **Independent component system**
   The template keeps Astryx as the component and interaction kernel instead of introducing a second React UI library.

2. **Global stylesheet behavior**
   The template does not import an unlayered third-party component stylesheet. Astryx themes are generated as scoped, layered CSS.

3. **Large font and component bundles**
   The template uses subset-capable Fontsource variable packages and checks emitted font/CSS/JS budgets. It does not copy the reference package's font payload.

4. **Light-only theme assumptions**
   The child theme family defines distinct light and warm dusk values for every semantic token.

5. **Component lifecycle and overlay bugs**
   Dialogs, focus, keyboard behavior, form state, progress, and announcements remain owned by Astryx and are covered by template tests.

6. **Documentation drift**
   Theme generation, asset provenance, Astryx boundaries, catalog parity, and age-profile behavior are part of the template verification gate.

7. **Precise age and child privacy risk**
   The template persists only a coarse age band. A consuming product must perform a separate privacy review before storing exact age, birth date, or identifying child data.

## Maintenance Rule

If this record changes, update the reviewed commit, the adopted/rejected rationale, and the child template design documentation together. The provenance check in `scripts/check-assets.mjs` requires this reviewed commit to remain recorded until a documented replacement review is completed.
