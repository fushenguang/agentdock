---
'@cogito.ai/cli': minor
---

Add the `game-web-phaser` template — a Phaser 3 + Vite + TypeScript scaffold for
browser games written by AI coding agents.

Why this template exists: two real agent-driven runs, given only a
natural-language goal, hand-wrote vanilla JS + Canvas from scratch and shipped a
canvas-offset bug and a space-key hang. Prose in the prompt did not prevent it.
This template encodes the constraints as executable scaffolding instead:

- Phaser's Scale Manager (`FIT` + `CENTER_BOTH`) so the canvas cannot drift out
  of the visible area
- A conventional input setup that stops space/arrow keys from scrolling the page
- Boot / Preload / Game scenes split up front, so the agent has structure to
  extend rather than a blank file to improvise in
- `dev` / `preview` pinned to port 8080, so the surrounding system can create a
  stable share link
- An `AGENTS.md` for the *generated* project carrying the hard-won operational
  rules: never run a non-exiting foreground process, commit every verifiable
  step, and verify real rendered position and real key presses rather than
  property values
