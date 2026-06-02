#!/usr/bin/env node
/**
 * align-check — AgentDock Anti-Drift Invariant Checker
 *
 * Validates machine-checkable anti-drift invariants.
 * Exit codes: non-zero on hard failures, 0 on warnings-only or clean.
 *
 * Invariants:
 *   1. Orphan change  (hard fail) — every change must link an existing roadmap id
 *   2. Orphan feature (hard fail) — every src/features/* needs a change (skipped for meta-repos)
 *   3. WIP limit      (warning)   — in-progress epics in roadmap <= 1
 *   4. Zombie change  (warning)   — draft + overdue (from .openspec.yaml created field)
 *   5. Non-goals      (hard fail) — every change proposal must have a non-empty Non-goals section
 *
 * Usage:
 *   node --import=tsx/esm scripts/align-check/index.ts            # full check
 *   node --import=tsx/esm scripts/align-check/index.ts --fast     # pre-commit subset (1, 3)
 *
 * Note: Run via `pnpm align:check` or `pnpm align:check --fast`
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const ROADMAP_FILE = join(REPO_ROOT, 'roadmap.yaml')
const CHANGES_DIR = join(REPO_ROOT, 'openspec', 'changes')
const ARCHIVE_DIR = join(CHANGES_DIR, 'archive')
const META_MARKER_FILE = join(REPO_ROOT, '.agentdock-meta')
const PACKAGE_JSON_FILE = join(REPO_ROOT, 'package.json')
const SRC_FEATURES_DIR = join(REPO_ROOT, 'src', 'features')

/** Zombie threshold in days (overridable via ALIGN_ZOMBIE_DAYS env) */
const ZOMBIE_DAYS = Number(process.env['ALIGN_ZOMBIE_DAYS'] ?? 30)

const isFastMode = process.argv.includes('--fast')

// ---------------------------------------------------------------------------
// Lightweight YAML parser (covers roadmap.yaml & frontmatter formats only)
// ---------------------------------------------------------------------------

interface RoadmapEntry {
  id: string
  title: string
  status: 'planned' | 'in-progress' | 'done'
  owner: string
}

interface Roadmap {
  now: RoadmapEntry[]
  next: RoadmapEntry[]
  later: RoadmapEntry[]
  wont: RoadmapEntry[]
}

const ROADMAP_STATUS_VALUES = new Set<RoadmapEntry['status']>(['planned', 'in-progress', 'done'])

/**
 * Parse the roadmap.yaml file into a typed structure.
 * Handles the specific four-bucket format — not a general YAML parser.
 */
function parseRoadmap(content: string): Roadmap {
  const buckets: Roadmap = { now: [], next: [], later: [], wont: [] }
  const bucketNames = ['now', 'next', 'later', 'wont'] as const

  let currentBucket: (typeof bucketNames)[number] | null = null
  let currentEntry: Partial<RoadmapEntry> | null = null

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trimEnd()

    // Skip comments and empty lines
    if (line.trim().startsWith('#') || line.trim() === '') continue

    // Detect bucket header (e.g., "now:" or "now: []")
    const bucketMatch = /^(now|next|later|wont):\s*(?:\[\])?$/.exec(line)
    if (bucketMatch) {
      if (currentEntry) {
        pushEntry(buckets, currentBucket!, currentEntry)
        currentEntry = null
      }
      currentBucket = bucketMatch[1] as (typeof bucketNames)[number]
      continue
    }

    // Detect list item start (e.g., "  - id: ...")
    const itemStart = /^\s+-\s+id:\s+"?([^"]+)"?\s*$/.exec(line)
    if (itemStart && currentBucket) {
      if (currentEntry) pushEntry(buckets, currentBucket, currentEntry)
      currentEntry = { id: itemStart[1].trim() }
      continue
    }

    // Parse sub-fields within an entry
    if (currentEntry) {
      const fieldMatch = /^\s+(title|status|owner):\s+"?(.+?)"?\s*$/.exec(line)
      if (fieldMatch) {
        const key = fieldMatch[1] as keyof RoadmapEntry
        ;(currentEntry as Record<string, string>)[key] = fieldMatch[2].trim()
      }
    }
  }

  if (currentEntry && currentBucket) {
    pushEntry(buckets, currentBucket, currentEntry)
  }

  return buckets
}

function pushEntry(buckets: Roadmap, bucket: keyof Roadmap, entry: Partial<RoadmapEntry>): void {
  buckets[bucket].push(entry as RoadmapEntry)
}

/**
 * Parse YAML frontmatter from a markdown file.
 * Returns a key-value map of frontmatter fields, or null if none.
 */
function parseFrontmatter(content: string): Record<string, string> | null {
  if (!content.startsWith('---')) return null
  const end = content.indexOf('\n---', 3)
  if (end === -1) return null
  const fm = content.slice(3, end).trim()
  const result: Record<string, string> = {}
  for (const line of fm.split('\n')) {
    const m = /^([a-zA-Z0-9_-]+):\s*(.+)$/.exec(line.trim())
    if (m) result[m[1]] = normalizeYamlScalar(m[2])
  }
  return result
}

/** Normalize plain YAML scalar values (trim + remove wrapped quotes). */
function normalizeYamlScalar(value: string): string {
  const trimmed = value.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim()
  }
  return trimmed
}

/**
 * Extract roadmap id from a proposal.md content.
 * Dual-read: frontmatter `roadmap-id` first, fallback to body anchor `Roadmap 锚点：\`<id>\``
 */
function extractRoadmapId(content: string): string | null {
  // 1. Frontmatter (new, preferred format)
  const fm = parseFrontmatter(content)
  if (fm?.['roadmap-id']) return fm['roadmap-id']

  // 2. Body text anchor (legacy compat: `Roadmap 锚点：\`<id>\``)
  const bodyMatch = /Roadmap\s+锚点[：:]\s*`([^`]+)`/.exec(content)
  if (bodyMatch) return bodyMatch[1].trim()

  return null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readFile(path: string): string {
  return readFileSync(path, 'utf8')
}

function fileExists(path: string): boolean {
  return existsSync(path)
}

/** Get all non-archived change directory names */
function getActiveChangeDirs(): string[] {
  if (!fileExists(CHANGES_DIR)) return []
  return readdirSync(CHANGES_DIR).filter((name) => {
    if (name === 'archive') return false
    const full = join(CHANGES_DIR, name)
    return statSync(full).isDirectory()
  })
}

/** Get all archived change directory names. */
function getArchivedChangeDirs(): string[] {
  if (!fileExists(ARCHIVE_DIR)) return []
  return readdirSync(ARCHIVE_DIR).filter((name) => {
    const full = join(ARCHIVE_DIR, name)
    return statSync(full).isDirectory()
  })
}

/**
 * Normalize change directory names for feature mapping.
 * Supports archived names like "2026-06-01-my-feature".
 */
function changeNameAliases(changeDirName: string): string[] {
  const aliases = new Set([changeDirName])
  const archivedNameMatch = /^\d{4}-\d{2}-\d{2}-(.+)$/.exec(changeDirName)
  if (archivedNameMatch?.[1]) {
    aliases.add(archivedNameMatch[1])
  }
  return [...aliases]
}

/**
 * Determine if a change is "draft": non-archived AND tasks.md has unchecked items
 * (or tasks.md is absent).
 */
function isDraft(changeDir: string): boolean {
  const tasksFile = join(changeDir, 'tasks.md')
  if (!fileExists(tasksFile)) return true // no tasks.md → treat as draft
  const content = readFile(tasksFile)
  return /^\s*-\s+\[\s+\]/m.test(content) // has unchecked box
}

/** Get the creation date from .openspec.yaml */
function getCreatedDate(changeDir: string): Date | null {
  const metaFile = join(changeDir, '.openspec.yaml')
  if (!fileExists(metaFile)) return null
  const content = readFile(metaFile)
  const m = /created:\s*(\d{4}-\d{2}-\d{2})/.exec(content)
  if (!m) return null
  return new Date(m[1])
}

/** Days elapsed since a given date */
function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
}

/** Check if this repo is a meta-repo (exempt from orphan-feature check) */
function isMetaRepo(): boolean {
  if (fileExists(META_MARKER_FILE)) return true
  if (!fileExists(PACKAGE_JSON_FILE)) return false
  try {
    const pkg = JSON.parse(readFile(PACKAGE_JSON_FILE)) as Record<string, unknown>
    const agentdock = pkg['agentdock'] as Record<string, unknown> | undefined
    return agentdock?.['metaRepo'] === true
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Report builders
// ---------------------------------------------------------------------------

interface Issue {
  kind: 'fail' | 'warn'
  rule: string
  message: string
}

const issues: Issue[] = []

function fail(rule: string, message: string): void {
  issues.push({ kind: 'fail', rule, message })
}

function warn(rule: string, message: string): void {
  issues.push({ kind: 'warn', rule, message })
}

// ---------------------------------------------------------------------------
// Invariant checks
// ---------------------------------------------------------------------------

/**
 * Validate roadmap.yaml schema:
 * - Required fields present on every entry
 * - No duplicate ids
 */
function checkRoadmapSchema(roadmap: Roadmap, allIds: Set<string>): void {
  const requiredFields: (keyof RoadmapEntry)[] = ['id', 'title', 'status', 'owner']
  const seenIds = new Set<string>()

  for (const bucket of ['now', 'next', 'later', 'wont'] as const) {
    for (const entry of roadmap[bucket]) {
      for (const field of requiredFields) {
        if (!entry[field]) {
          fail(
            'roadmap-schema',
            `Entry id="${entry.id ?? '(unknown)'}" in bucket "${bucket}" is missing field "${field}"`,
          )
        }
      }
      if (entry.status && !ROADMAP_STATUS_VALUES.has(entry.status)) {
        fail(
          'roadmap-schema',
          `Entry id="${entry.id ?? '(unknown)'}" has invalid status "${entry.status}" (allowed: planned, in-progress, done)`,
        )
      }
      if (entry.id) {
        if (seenIds.has(entry.id)) {
          fail('roadmap-schema', `Duplicate roadmap id: "${entry.id}"`)
        }
        seenIds.add(entry.id)
        allIds.add(entry.id)
      }
    }
  }
}

/**
 * Invariant 1: Orphan change (hard fail)
 * Every non-archived change must reference an existing roadmap id.
 */
function checkOrphanChanges(roadmapIds: Set<string>): void {
  for (const name of getActiveChangeDirs()) {
    const proposalFile = join(CHANGES_DIR, name, 'proposal.md')
    if (!fileExists(proposalFile)) {
      fail('orphan-change', `Change "${name}": missing proposal.md (cannot verify roadmap-id)`)
      continue
    }
    const content = readFile(proposalFile)
    const id = extractRoadmapId(content)
    if (!id) {
      fail(
        'orphan-change',
        `Change "${name}": no roadmap-id found (add frontmatter \`roadmap-id\` or body \`Roadmap 锚点：\\\`<id>\\\`\`)`,
      )
    } else if (!roadmapIds.has(id)) {
      fail(
        'orphan-change',
        `Change "${name}": references roadmap-id "${id}" which does not exist in roadmap.yaml`,
      )
    }
  }
}

/**
 * Invariant 2: Orphan feature (hard fail) — skipped for meta-repos
 * Every src/features/* directory must correspond to a known change.
 */
function checkOrphanFeatures(): void {
  if (isMetaRepo()) {
    console.log('  ↳ Meta-repo detected — orphan-feature check skipped')
    return
  }
  if (!fileExists(SRC_FEATURES_DIR)) return

  const changeNames = new Set<string>()
  const allChangeDirs = [...getActiveChangeDirs(), ...getArchivedChangeDirs()]
  for (const changeName of allChangeDirs) {
    for (const alias of changeNameAliases(changeName)) {
      changeNames.add(alias)
    }
  }

  for (const feature of readdirSync(SRC_FEATURES_DIR)) {
    const featureDir = join(SRC_FEATURES_DIR, feature)
    if (!statSync(featureDir).isDirectory()) continue
    if (!changeNames.has(feature)) {
      fail(
        'orphan-feature',
        `Feature "src/features/${feature}" has no corresponding change in openspec/changes/`,
      )
    }
  }
}

/**
 * Invariant 3: WIP limit (warning)
 * Number of "in-progress" roadmap items must be <= 1.
 */
function checkWipLimit(roadmap: Roadmap): void {
  const inProgress: string[] = []
  for (const bucket of ['now', 'next', 'later', 'wont'] as const) {
    for (const entry of roadmap[bucket]) {
      if (entry.status === 'in-progress') inProgress.push(entry.id)
    }
  }
  if (inProgress.length > 1) {
    warn(
      'wip-limit',
      `WIP limit exceeded: ${inProgress.length} in-progress epics (limit: 1). In-progress: ${inProgress.join(', ')}`,
    )
  }
}

/**
 * Invariant 4: Zombie change (warning)
 * A change is "zombie" if it is draft AND created > ZOMBIE_DAYS ago.
 */
function checkZombieChanges(): void {
  for (const name of getActiveChangeDirs()) {
    const changeDir = join(CHANGES_DIR, name)
    if (!isDraft(changeDir)) continue // fully checked off → not draft
    const created = getCreatedDate(changeDir)
    if (!created) continue // can't determine age → skip
    const age = daysSince(created)
    if (age > ZOMBIE_DAYS) {
      warn(
        'zombie-change',
        `Change "${name}" is draft and ${age} days old (threshold: ${ZOMBIE_DAYS} days)`,
      )
    }
  }
}

/**
 * Invariant 5: Non-goals present (hard fail)
 * Every change proposal must contain a non-empty Non-goals section.
 */
function checkNonGoals(): void {
  for (const name of getActiveChangeDirs()) {
    const proposalFile = join(CHANGES_DIR, name, 'proposal.md')
    if (!fileExists(proposalFile)) continue // already caught by orphan-change
    const content = readFile(proposalFile)
    // Match "## Non-goals" or "## Non-Goals" section with non-empty body
    const nonGoalsMatch = /##\s+Non-goals?\b([^]*?)(?=\n##|\s*$)/i.exec(content)
    if (!nonGoalsMatch) {
      fail('non-goals', `Change "${name}": proposal.md has no Non-goals section`)
      continue
    }
    const body = nonGoalsMatch[1].trim()
    if (!body || body.replace(/[-\s]/g, '').length === 0) {
      fail('non-goals', `Change "${name}": proposal.md has an empty Non-goals section`)
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function printReport(): void {
  const fails = issues.filter((i) => i.kind === 'fail')
  const warns = issues.filter((i) => i.kind === 'warn')

  const col = (n: number, str: string) => str.padEnd(n)

  if (issues.length === 0) {
    console.log('\n  ✓ All alignment checks passed\n')
    return
  }

  console.log('')
  if (fails.length > 0) {
    console.log(`  HARD FAILURES (${fails.length}):`)
    for (const issue of fails) {
      console.log(`    ✗ [${col(20, issue.rule + ']')} ${issue.message}`)
    }
  }
  if (warns.length > 0) {
    console.log(`\n  WARNINGS (${warns.length}):`)
    for (const issue of warns) {
      console.log(`    ⚠ [${col(20, issue.rule + ']')} ${issue.message}`)
    }
  }
  console.log('')
}

async function main(): Promise<void> {
  const mode = isFastMode ? 'fast (pre-commit subset)' : 'full'
  console.log(`\nAgentDock align:check — ${mode} mode`)
  console.log('='.repeat(50))

  // --- Load & validate roadmap.yaml ---
  if (!fileExists(ROADMAP_FILE)) {
    fail('roadmap-schema', 'roadmap.yaml not found at repository root')
    printReport()
    process.exit(1)
  }

  const roadmapContent = readFile(ROADMAP_FILE)
  const roadmap = parseRoadmap(roadmapContent)
  const roadmapIds = new Set<string>()

  console.log('\nChecking roadmap.yaml schema...')
  checkRoadmapSchema(roadmap, roadmapIds)

  // --- Run invariants ---
  console.log('Checking invariant 1: orphan changes...')
  checkOrphanChanges(roadmapIds)

  if (!isFastMode) {
    console.log('Checking invariant 2: orphan features...')
    checkOrphanFeatures()
  }

  console.log('Checking invariant 3: WIP limit...')
  checkWipLimit(roadmap)

  if (!isFastMode) {
    console.log('Checking invariant 4: zombie changes...')
    checkZombieChanges()

    console.log('Checking invariant 5: Non-goals presence...')
    checkNonGoals()
  }

  // --- Report ---
  printReport()

  const hardFails = issues.filter((i) => i.kind === 'fail').length
  if (hardFails > 0) {
    console.error(`  ${hardFails} hard failure(s) detected. Fix before continuing.\n`)
    process.exit(1)
  }
}

main().catch((err: unknown) => {
  console.error('align-check crashed:', err)
  process.exit(1)
})
