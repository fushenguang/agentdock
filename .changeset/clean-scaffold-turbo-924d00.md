---
"@cogito.ai/cli": patch
---

Remove rewriteTurboJson post-processing from scaffold; template turbo.json is now standalone (no extends) so no post-processing is needed after scaffolding.
