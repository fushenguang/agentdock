---
'@cogito.ai/cli': patch
---

`skill publish`: normalize the manifest `source` into an anonymous, credential-free URL.

Previously the raw output of `git remote get-url origin` was written verbatim, so whether a
published manifest could be installed by anyone else depended on the publisher's local git
config — the same repo published by two contributors produced one installable and one
non-installable manifest, and the difference was invisible to the publisher (their own clone
always works).

SSH (`git@host:owner/repo.git`), `ssh://`, `git+ssh://` and `git://` forms are now normalized to
`https://host/owner/repo`. Credentials embedded in the URL (`https://user:token@host/...`) are
stripped — a manifest is meant to be committed into a public registry repo. Remotes that cannot
be normalized into something a stranger can clone (local paths, `file://`, dotless hosts that are
almost certainly `~/.ssh/config` aliases) now fail with an actionable error instead of being
written silently.
