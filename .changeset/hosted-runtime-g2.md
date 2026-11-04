---
"@cogito.ai/cli": patch
---

Sync the hosted runtime from web-scaffold 0.5.1: descriptor `execution` now takes precedence over
the legacy sidecar, execution conflicts fail closed, and SSR stream timeout or client replacement
no longer terminates the package runtime.
