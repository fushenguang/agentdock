---
name: prepare-domain-package-release
description: Prepare a reproducible source-only release without committing build output.
---

# Prepare a release

1. Run checks from a clean clone.
2. Build the package artifact through the package's release command.
3. Record package id/version, template standards versions, build entry, and checksum.
4. Leave generated output out of Git.
5. Require human approval before publishing.
