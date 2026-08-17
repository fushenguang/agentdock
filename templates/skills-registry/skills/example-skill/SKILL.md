---
name: example-skill
description: A minimal, valid example skill shipped with the skills-registry template so the three CI gates (validation, manifest freshness, public/private boundary) have something real to check from the moment a repo is created — replace or delete this once you add your own skills.
license: MIT
---

# Example Skill

This is a placeholder skill. It exists so that:

1. Gate ① (`agentdock skill validate`) has at least one skill to validate on day one.
2. Gate ② (manifest freshness) has a real entry to republish and diff against `skills.json`.
3. Gate ③ (public/private boundary) has real, tracked files to scan.
4. `pnpm skills:sync` has something to turn into a docs page under
   `apps/docs/content/docs/skills/`.

## When to delete this

Once you've added your first real skill and run `pnpm skills:sync`, it's safe to delete this
directory (and its generated docs page). Nothing in the gates or the docs generator depends on
a skill named `example-skill` specifically — they iterate over whatever exists under `skills/`.

## Anatomy of a valid `SKILL.md`

- Frontmatter `name` is **required** and must exactly match this directory's name
  (`example-skill`) — the Agent Skills spec ties skill identity to its containing directory.
- Frontmatter `description` is **required** and is written in English — it's the field a
  consumer reads from the manifest before deciding whether to install the skill, so treat it
  as the skill's pitch, not internal notes.
- `license` is optional but recommended for a public registry.
- The body (this text) is the skill's actual instructions/content — write it however you'd
  write documentation for the capability the skill provides.
