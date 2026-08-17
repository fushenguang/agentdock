#!/usr/bin/env node
// gate ② — skills.json + generated docs freshness.
//
// Two independent freshness checks (design.md §6 — "one gate, two generated artifacts"):
//
//   A. skills.json vs. a fresh `skill publish` of every skills/* directory into a scratch
//      registry. Comparison ignores `publishedAt` (design.md §2 "★" / proposal.md's decision
//      甲) — that field is written fresh on every publish by CLI design, so comparing it
//      byte-for-byte would make this gate permanently red. Every other field is compared
//      exactly, and entries are matched by `id` (order doesn't carry meaning — `publish`
//      appends in traversal order).
//
//   B. apps/docs/content/docs/skills/* vs. what scripts/gen-skill-docs.mjs would generate from
//      the CURRENTLY COMMITTED skills.json (not the fresh republish — docs are a pure function
//      of the manifest, one generation step removed from check A).
//
// If the committed skills.json still has a skill entry with the template's placeholder
// `source` (shipped by design.md §2 "★" — the template cannot know the real git remote), this
// gate fails with a message pointing at `pnpm skills:sync`, not just a generic field diff
// (spec.md scenario "bootstrap 之前门② 的失败必须指明该跑什么").
//
// Usage:
//   node scripts/gates/manifest-fresh.mjs            # compare only (CI mode)
//   node scripts/gates/manifest-fresh.mjs --write     # write the fresh manifest for real
//                                                        (used by `pnpm skills:sync`)

import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { listSkillDirs, runAgentdock, REPO_ROOT } from './_lib.mjs'
import { buildDocsFiles, readExistingDocsFiles } from '../gen-skill-docs.mjs'

export const PLACEHOLDER_SOURCE = 'agentdock-template-placeholder://run-pnpm-skills-sync'
const MANIFEST_PATH = join(REPO_ROOT, 'skills.json')
const SYNC_HINT = 'pnpm skills:sync'

function loadCommittedManifest() {
  if (!existsSync(MANIFEST_PATH)) {
    return { version: '1', skills: [] }
  }
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'))
}

/** Republishes every skills/* directory into a scratch registry. Returns the fresh manifest. */
function republishAll() {
  const skills = listSkillDirs(REPO_ROOT)
  const scratchDir = mkdtempSync(join(tmpdir(), 'skills-registry-gate2-'))

  try {
    for (const skill of skills) {
      const result = runAgentdock([
        'skill',
        'publish',
        skill.dir,
        '--registry',
        scratchDir,
        '--json',
      ])
      if (result.status !== 0) {
        throw new Error(
          `"agentdock skill publish ${skill.dir}" failed (exit ${result.status}).\nstdout: ${result.stdout}\nstderr: ${result.stderr}`,
        )
      }
    }

    const scratchManifestPath = join(scratchDir, 'skills.json')
    if (!existsSync(scratchManifestPath)) {
      return { version: '1', skills: [] }
    }
    return JSON.parse(readFileSync(scratchManifestPath, 'utf-8'))
  } finally {
    rmSync(scratchDir, { recursive: true, force: true })
  }
}

function byId(manifest) {
  const map = new Map()
  for (const entry of manifest.skills ?? []) {
    map.set(entry.id, entry)
  }
  return map
}

/** Fields compared byte-for-byte; publishedAt is deliberately excluded. */
const COMPARED_FIELDS = ['id', 'name', 'description', 'source', 'path', 'license', 'nonSpecFields']

/**
 * Diffs two manifests (ignoring publishedAt). Returns a list of human-readable diff lines,
 * empty when they're equivalent.
 */
function diffManifests(committed, fresh) {
  const committedById = byId(committed)
  const freshById = byId(fresh)
  const allIds = new Set([...committedById.keys(), ...freshById.keys()])
  const lines = []

  for (const id of [...allIds].sort()) {
    const c = committedById.get(id)
    const f = freshById.get(id)

    if (!c) {
      lines.push(`  [${id}] present after republish but missing from committed skills.json`)
      continue
    }
    if (!f) {
      lines.push(
        `  [${id}] present in committed skills.json but not produced by republish (stale entry — was the skill removed?)`,
      )
      continue
    }

    for (const field of COMPARED_FIELDS) {
      const cVal = JSON.stringify(c[field] ?? null)
      const fVal = JSON.stringify(f[field] ?? null)
      if (cVal !== fVal) {
        lines.push(`  [${id}] field "${field}": expected ${fVal}, actual (committed) ${cVal}`)
      }
    }
  }

  return lines
}

function diffDocs(committedManifest) {
  const expected = buildDocsFiles(committedManifest)
  const actual = readExistingDocsFiles(REPO_ROOT)
  const allPaths = new Set([...expected.keys(), ...actual.keys()])
  const lines = []

  for (const relPath of [...allPaths].sort()) {
    const exp = expected.get(relPath)
    const act = actual.get(relPath)
    if (exp === undefined) {
      lines.push(
        `  ${relPath}: exists on disk but is not generated from skills.json (stale file — remove it or re-run \`pnpm skills:sync\`)`,
      )
    } else if (act === undefined) {
      lines.push(
        `  ${relPath}: missing on disk (skills.json has this skill, docs page was never generated)`,
      )
    } else if (exp !== act) {
      lines.push(`  ${relPath}: content does not match what skills.json would generate`)
    }
  }

  return lines
}

function findPlaceholderIds(manifest) {
  return (manifest.skills ?? []).filter((s) => s.source === PLACEHOLDER_SOURCE).map((s) => s.id)
}

function main() {
  const write = process.argv.includes('--write')
  const committed = loadCommittedManifest()
  const fresh = republishAll()

  if (write) {
    writeFileSync(MANIFEST_PATH, JSON.stringify(fresh, null, 2) + '\n', 'utf-8')
    console.log(`gate ② (manifest-fresh): wrote ${fresh.skills.length} skill(s) to skills.json`)
    process.exit(0)
  }

  const placeholderIds = findPlaceholderIds(committed)
  const manifestDiff = diffManifests(committed, fresh)
  const docsDiff = diffDocs(committed)

  if (placeholderIds.length === 0 && manifestDiff.length === 0 && docsDiff.length === 0) {
    console.log(
      `gate ② (manifest-fresh): ✓ skills.json and docs pages are fresh (${fresh.skills.length} skill(s)).`,
    )
    process.exit(0)
  }

  console.error('\ngate ② (manifest-fresh): ✗ manifest or docs are not fresh.\n')

  if (placeholderIds.length > 0) {
    console.error(
      `  skills.json still has the template placeholder \`source\` for: ${placeholderIds.join(', ')}.`,
    )
    console.error(
      `  This repo hasn't been bootstrapped yet. Run \`${SYNC_HINT}\` and commit the result.\n`,
    )
  }

  if (manifestDiff.length > 0) {
    console.error('  skills.json is not fresh relative to skills/*:')
    for (const line of manifestDiff) console.error(line)
    console.error(`  Run \`${SYNC_HINT}\` to regenerate skills.json and commit the result.\n`)
  }

  if (docsDiff.length > 0) {
    console.error('  apps/docs/content/docs/skills/* is not fresh relative to skills.json:')
    for (const line of docsDiff) console.error(line)
    console.error(`  Run \`${SYNC_HINT}\` to regenerate the docs pages and commit the result.\n`)
  }

  process.exit(1)
}

main()
