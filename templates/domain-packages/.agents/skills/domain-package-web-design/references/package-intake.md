# Package design intake

Use this once for a domain package Web, or again only when the product or design direction changes.
Ask in small batches and wait for the owner. The output belongs in `PRODUCT.md` and `DESIGN.md`.

## Questions

### Audience and posture

- Who uses this package Web?
- Where do they use it: desktop App panel, mobile App, browser?
- How often, and under what pressure or interruption?
- Is the Web the main product surface or an auxiliary workbench for an App Agent session?

### Core product model

- What one or two outcomes make this Web useful?
- What must be true for the user to say the task is done?
- Which objects are primary: records, plans, documents, canvases, tasks, media?
- Which functions are core, secondary, auxiliary, and diagnostic?

### Visual direction

- Give three character words and one anti-reference.
- Is the intended feel minimal, compact, calm, professional, warm, playful, editorial, or another
  named direction?
- Which real products are useful references, and what exactly should be borrowed?
- Which patterns must not be copied?

### Composition

- What density is appropriate: comfortable, compact, or dense?
- Which surfaces must remain visible while the user works?
- Which configuration, forms, metadata, and history belong in drawers, disclosures, menus, sheets,
  contextual routes, or settings?
- What page types does the product need: landing, list, workbench, form, settings, editor?

### Style system

- Typography scale and heading hierarchy.
- Color roles and the single accent source.
- Spacing and radius rhythm.
- Focus, hover, press, loading, saving, error, and motion behavior.
- Host appearance constraints and light/dark expectations.

## Record in DESIGN.md

Capture the answers as rules another agent can follow:

- `## Audience and context`
- `## Information hierarchy`
- `## Visual direction`
- `## Page grammar`
- `## Content shape and component policy`
- `## Hidden-by-default policy`
- `## Interaction and motion`

Keep Astryx as the source for implementation details. Do not create a parallel token list or component
catalog.

## Direction exploration

Use Stitch when the direction is genuinely unknown. Produce two or three directions that differ along
one named axis, not three restyles of the same generic dashboard. If Stitch is unavailable, use local
Astryx sample pages and installed themes.

For each direction show:

1. archetype and base theme;
2. personality and reference logic;
3. page grammar;
4. hierarchy and density;
5. representative first screen.

Stop and wait for an owner decision. Record the chosen direction and the owner's words under
`## Decisions`.
