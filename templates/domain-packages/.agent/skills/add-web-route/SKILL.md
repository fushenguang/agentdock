---
name: add-web-route
description: Add a route-purpose workbench surface to a generated package Web.
---

# Add a Web route

1. Declare route id, path, purpose, preconditions, elements, state, actions, and capabilities in
   `agent/web-surface.json`.
2. Preserve a left-agent / right-workbench interaction model.
3. Add the `apps/web` page implementation only after the structured surface exists.
4. Do not describe interaction through DOM selectors or coordinates.
5. Run package and Web checks.
