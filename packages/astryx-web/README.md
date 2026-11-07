# @cogito.ai/astryx-web

Mobile-first page archetypes and shared web design guidance for AgentDock projects.

## Contents

- `dock-landing`, `dock-workbench`, `dock-list`, `dock-form-flow`, `dock-settings`, and
  `dock-editor-frame` page templates
- Design-base documentation, starting with `pnpm exec astryx docs dock-design-base`
- Agent guidance for creating pages from templates
- `astryx-web samples` for repeatable visual review

The list, form, settings, and editor templates replace Core templates with the same intent. Use
`--package @astryxdesign/core` when the original is deliberately needed.

## Visual samples

```bash
astryx-web samples \
  --base-url http://localhost:3000 \
  --route /zh-CN/settings \
  --theme neutral \
  --mode light \
  --mode dark \
  --size 390x844 \
  --size 1440x900 \
  --out design-samples
```

Set `CHROME_PATH` to the system Chrome executable. The command writes one PNG per combination and
an `index.json` containing the rendered routes and source commit.

## License

MIT
