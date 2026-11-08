---
'@cogito.ai/cli': patch
---

Recreate `.claude/skills` links for every bundled domain-package agent skill during install, so npm
packaging cannot drop those links and both Codex and Claude Code receive the same guidance.
