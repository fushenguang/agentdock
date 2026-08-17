// _lib.mjs — small shared helpers for the three gate scripts.
// Not a gate itself. Pure Node ESM, no dependencies, no build step (design.md §3).

import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Base command used to invoke the agentdock CLI.
 *
 * Default is `pnpm exec agentdock` — the devDependency-pinned CLI (design.md §4).
 * Override with the AGENTDOCK_CMD env var (space-separated command + args) when the
 * pinned devDependency isn't installed yet — e.g. `AGENTDOCK_CMD="node /path/to/dist/index.js"`
 * to point at a locally built CLI while `@cogito.ai/cli` is still a placeholder version
 * (tasks.md 2.7). Real CI never needs to set this.
 */
function agentdockBaseCmd() {
  const override = process.env['AGENTDOCK_CMD']
  if (override && override.trim()) {
    return override.trim().split(/\s+/)
  }
  return ['pnpm', 'exec', 'agentdock']
}

/** Runs `agentdock <...args>`, returns { status, stdout, stderr }. Never throws. */
export function runAgentdock(args) {
  const [cmd, ...base] = agentdockBaseCmd()
  const result = spawnSync(cmd, [...base, ...args], {
    encoding: 'utf-8',
    cwd: process.cwd(),
  })
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    error: result.error,
  }
}

/** Lists immediate subdirectories of `skills/` (the skill id candidates). */
export function listSkillDirs(repoRoot) {
  const skillsDir = join(repoRoot, 'skills')
  if (!existsSync(skillsDir)) return []
  return readdirSync(skillsDir)
    .map((name) => ({ name, dir: join(skillsDir, name) }))
    .filter((entry) => statSync(entry.dir).isDirectory())
}

/** `git ls-files` relative to cwd — the "all tracked files" gate ③ scans. */
export function gitLsFiles(repoRoot) {
  const result = spawnSync('git', ['ls-files'], {
    encoding: 'utf-8',
    cwd: repoRoot,
  })
  if (result.status !== 0) {
    throw new Error(
      `"git ls-files" failed in ${repoRoot} (exit ${result.status}). Gate ③ requires a git repository with tracked files.\n${result.stderr}`,
    )
  }
  return result.stdout.split('\n').filter((line) => line.trim().length > 0)
}

export const REPO_ROOT = process.cwd()
