---
name: add-web-route
description: Add a route-purpose workbench surface to a generated package Web.
---

# Add a Web route

1. Use `domain-package-web-design`: ask for the page's one core function, primary action,
   above-the-fold content, and hidden-by-default content. Add the approved row to `DESIGN.md` under
   `## Page briefs`.
2. Declare route id, path, purpose, preconditions, elements, state, actions, and capabilities in
   `agent/web-surface.json`.
3. Create the page with
   `pnpm --filter <web package> page:new "<intent>" --route <path>`. Put the page type last: write
   `mobile settings page`, not `settings page on mobile`. If the entry rejects the intent, select
   from the templates it prints and pass `--template <id>`.
4. Adapt the page only inside the generated template sections. Add page copy to the generated
   locale catalog and replace `SAMPLE_*` data with feature data.
5. Do not describe interaction through DOM selectors or coordinates.
6. Run package and Web checks.
