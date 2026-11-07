---
name: add-web-route
description: Add a route-purpose workbench surface to a generated package Web.
---

# Add a Web route

1. Declare route id, path, purpose, preconditions, elements, state, actions, and capabilities in
   `agent/web-surface.json`.
2. Create the page with
   `pnpm --filter <web package> page:new "<intent>" --route <path>`. Put the page type last: write
   `mobile settings page`, not `settings page on mobile`. If the entry rejects the intent, select
   from the templates it prints and pass `--template <id>`.
3. Adapt the page only inside the generated template sections. Add page copy to the generated
   locale catalog and replace `SAMPLE_*` data with feature data.
4. Do not describe interaction through DOM selectors or coordinates.
5. Run package and Web checks.
