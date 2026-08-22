#!/usr/bin/env node
/**
 * changeset-check — require a changeset for anything that ends up in a published tarball
 *
 * Background: three template PRs (#70/#71/#72, all merged into main) shipped real
 * user-facing changes to `templates/game-web-phaser` — HUD band + UI Scene, a
 * bundled Phaser skill, an in-game doc panel — without a single `.changeset/*.md`.
 * changesets only cuts a "Version Packages" PR (and only that PR's merge triggers
 * `npm publish`) when `.changeset/*.md` files exist. No changeset ⇒ the change sits
 * on main forever and never reaches `npx @cogito.ai/cli init` — confirmed by
 * `npm pack @cogito.ai/cli@0.17.0` containing zero references to any of the three.
 *
 * Scope (verified against packages/cli/package.json's `build` script, not guessed):
 *   - `templates/**`            — `pnpm build` rsyncs the *entire* repo-root
 *                                  templates/ tree (minus node_modules/.next/.turbo)
 *                                  into `dist/templates/`, and `files: ["dist/"]`
 *                                  ships that whole tree in the npm tarball.
 *   - `packages/cli/src/**`     — `bun build bin/agentdock.ts --outfile dist/index.js`
 *   - `packages/cli/bin/**`       bundles whatever these files transitively import.
 *
 * Excluded from the scope (a diff touching only these never needs a changeset):
 *   - docs: `**\/*.md`, `**\/*.mdx`
 *   - tests: `**\/*.test.ts`, `**\/*.test.mjs`, `**\/*.test.js`, `**\/*.spec.ts`,
 *     anything under a `tests/` or `__tests__/` directory (not imported by the
 *     bundled entrypoint / not meaningfully "shipped behavior")
 *   - `.github/**` and `.changeset/**` themselves
 *
 * Usage:
 *   tsx scripts/changeset-check/index.ts [baseRef]
 *
 * `baseRef` defaults to $CHANGESET_CHECK_BASE, then `origin/main`. In CI this is
 * set to `origin/<pull_request base ref>` so the diff is scoped to the PR only.
 */

import { spawnSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

// ---------------------------------------------------------------------------
// Scope
// ---------------------------------------------------------------------------

const SCOPE_PREFIXES = ['templates/', 'packages/cli/src/', 'packages/cli/bin/']

const EXCLUDE_PATTERNS: RegExp[] = [
  /\.mdx?$/i,
  /\.test\.(ts|tsx|mjs|js)$/i,
  /\.spec\.(ts|tsx|mjs|js)$/i,
  /(^|\/)(tests|__tests__)\//,
  /^\.github\//,
  /^\.changeset\//,
]

function inScope(path: string): boolean {
  if (!SCOPE_PREFIXES.some((prefix) => path.startsWith(prefix))) return false
  return !EXCLUDE_PATTERNS.some((pattern) => pattern.test(path))
}

// ---------------------------------------------------------------------------
// Git plumbing
// ---------------------------------------------------------------------------

function git(args: string[]): string {
  const result = spawnSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8' })
  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${result.stderr || result.stdout}`)
  }
  return result.stdout
}

function changedFiles(baseRef: string): string[] {
  // Triple-dot: diff against the merge-base, so unrelated commits already on
  // baseRef (e.g. main moved on after the PR branched) don't pollute the list.
  const out = git(['diff', '--name-only', `${baseRef}...HEAD`])
  return out.split('\n').map((line) => line.trim()).filter(Boolean)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const baseRef = process.argv[2] ?? process.env['CHANGESET_CHECK_BASE'] ?? 'origin/main'

  let files: string[]
  try {
    files = changedFiles(baseRef)
  } catch (err) {
    console.error(`changeset-check: could not diff against ${baseRef}`)
    console.error(String(err instanceof Error ? err.message : err))
    process.exit(1)
    return
  }

  const relevant = files.filter(inScope)
  const hasChangeset = files.some((f) => /^\.changeset\/.+\.md$/.test(f))

  if (relevant.length === 0) {
    console.log('changeset-check: no publishable path changed (templates/, packages/cli/src|bin) — skipping.')
    process.exit(0)
    return
  }

  if (hasChangeset) {
    console.log(`changeset-check: ${relevant.length} publishable file(s) changed, changeset present — OK.`)
    for (const f of relevant) console.log(`  - ${f}`)
    process.exit(0)
    return
  }

  console.error('changeset-check: FAILED')
  console.error('')
  console.error('This PR changes files that ship inside the @cogito.ai/cli npm package,')
  console.error('but adds no .changeset/*.md. Without one, changesets will never open a')
  console.error('"Version Packages" PR for this change, and it will silently never be')
  console.error('published to npm — exactly what happened to PR #70/#71/#72.')
  console.error('')
  console.error('Publishable files changed in this PR:')
  for (const f of relevant) console.error(`  - ${f}`)
  console.error('')
  console.error('Fix: run `pnpm changeset`, describe the user-facing change, commit the')
  console.error('generated .changeset/*.md, and push again.')
  process.exit(1)
}

main()
