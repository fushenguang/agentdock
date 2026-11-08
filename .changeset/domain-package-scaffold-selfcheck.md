---
'@cogito.ai/cli': patch
---

Make a fresh domain-package Web pass its own formatter and expose the Astryx Claude Code skill
link immediately after generation, without a repair pass.

Also install the pinned Bun release from npm in the publish workflow to avoid recurring GitHub
release download failures.
