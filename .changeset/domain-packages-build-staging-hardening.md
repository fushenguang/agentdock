---
'@cogito.ai/cli': patch
---

Hardens domain-package build staging: generated root checks now include the fixed `web` member, package `start:web` launches that installed workspace member, and packaged text output has build-machine paths rewritten with fail-closed leak detection.
