#!/usr/bin/env node
// gate ③ — public/private boundary.
//
// This repo is public. Scans every git-tracked file's content against the regex patterns in
// boundary-rules.json (private repo paths, internal domains, personally identifiable
// patterns) and fails on any match, reporting file / line / category / pattern.
//
// The pattern table is data (boundary-rules.json), not hardcoded here — "what counts as
// private" is repo-specific (design.md §2). This gate came out of a real incident (2026-08-15
// de-identification miss — a half-redacted surname slipped through human review); its value
// is turning "remember to redact" from a human habit into a machine check, not being
// exhaustive (design.md §2's closing note).
//
// Usage: node scripts/gates/public-boundary.mjs

import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { gitLsFiles, REPO_ROOT } from './_lib.mjs'

const RULES_PATH = join(REPO_ROOT, 'boundary-rules.json')

/** Files that are binary-ish or otherwise not worth scanning as text; skip on read failure too. */
function isProbablyBinary(buf) {
  const len = Math.min(buf.length, 8000)
  for (let i = 0; i < len; i++) {
    if (buf[i] === 0) return true
  }
  return false
}

function loadRules() {
  if (!existsSync(RULES_PATH)) {
    throw new Error(`boundary-rules.json not found at ${RULES_PATH}`)
  }
  const raw = JSON.parse(readFileSync(RULES_PATH, 'utf-8'))
  const compiled = []
  for (const [category, def] of Object.entries(raw.categories ?? {})) {
    for (const patternSource of def.patterns ?? []) {
      compiled.push({
        category,
        patternSource,
        regex: new RegExp(patternSource, 'g'),
      })
    }
  }
  const hostPatterns = raw.categories?.[HOST_CATEGORY]?.patterns ?? []
  return { rules: compiled, hostCategoryEmpty: hostPatterns.length === 0 }
}

/**
 * The one category no generic default can fill: the host project's own name(s).
 *
 * Measured, not assumed — a dry run of this gate over 14 real skills extracted from a private
 * monorepo caught the host's source path but missed three sibling references to the same host
 * by product name. An empty list here is an honest blank, not a safe one, so say so loudly
 * rather than letting a green gate imply coverage it does not have.
 */
const HOST_CATEGORY = 'hostPrivateIdentifiers'

function warnIfHostCategoryEmpty(isEmpty) {
  if (!isEmpty) return
  console.warn(
    `\ngate ③ (public-boundary): ⚠ \`${HOST_CATEGORY}\` in boundary-rules.json is empty.`,
  )
  console.warn(
    "  A pass below does NOT mean your host project's name has been checked for — nothing is",
  )
  console.warn(
    '  looking for it yet. Add your private repo/product/package names there before publishing.\n',
  )
}

function scanFile(repoRoot, relPath, rules) {
  const absPath = join(repoRoot, relPath)
  let buf
  try {
    buf = readFileSync(absPath)
  } catch {
    return [] // deleted-but-tracked edge case, or unreadable — nothing to scan
  }
  if (isProbablyBinary(buf)) return []

  const content = buf.toString('utf-8')
  const lines = content.split('\n')
  const hits = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    for (const rule of rules) {
      rule.regex.lastIndex = 0
      const match = rule.regex.exec(line)
      if (match) {
        hits.push({
          file: relPath,
          line: i + 1,
          category: rule.category,
          pattern: rule.patternSource,
          excerpt: line.trim().slice(0, 160),
        })
      }
    }
  }

  return hits
}

function main() {
  const { rules, hostCategoryEmpty } = loadRules()
  warnIfHostCategoryEmpty(hostCategoryEmpty)
  // boundary-rules.json itself legitimately contains every pattern's source text — scanning
  // it for its own patterns would self-trigger, so it's exempt (it is data ABOUT the boundary,
  // not content that could cross it).
  const excluded = new Set(['boundary-rules.json'])

  const files = gitLsFiles(REPO_ROOT).filter((f) => !excluded.has(f))
  console.log(`gate ③ (public-boundary): scanning ${files.length} tracked file(s)...`)

  const allHits = []
  for (const file of files) {
    allHits.push(...scanFile(REPO_ROOT, file, rules))
  }

  if (allHits.length === 0) {
    console.log('gate ③ (public-boundary): ✓ no forbidden patterns found.')
    process.exit(0)
  }

  console.error(`\ngate ③ (public-boundary): ✗ ${allHits.length} match(es) found:\n`)
  for (const hit of allHits) {
    console.error(`  ${hit.file}:${hit.line}  [${hit.category}]  pattern: ${hit.pattern}`)
    console.error(`    ${hit.excerpt}`)
  }
  console.error('\n  If a match is a false positive, narrow the pattern in boundary-rules.json.')
  console.error(
    '  Do NOT add the file to an ignore list to make this pass — fix the content instead.\n',
  )
  process.exit(1)
}

main()
