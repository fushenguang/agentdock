#!/usr/bin/env node
// gate ① — full skill validation.
//
// Runs `agentdock skill validate --json` against EVERY directory under skills/, not just
// changed ones. Rationale (design.md §2): only validating changed skills would miss "A's
// change broke B" — e.g. a shared convention change, or a skills-ref version bump that makes a
// previously-valid skill invalid.
//
// Usage: node scripts/gates/validate-all.mjs
// Exit 0 if every skill is valid (or there are none), exit 1 otherwise.

import { listSkillDirs, runAgentdock, REPO_ROOT } from './_lib.mjs'

function main() {
  const skills = listSkillDirs(REPO_ROOT)

  if (skills.length === 0) {
    console.log('gate ① (validate-all): no skills under skills/ — nothing to check.')
    process.exit(0)
  }

  console.log(`gate ① (validate-all): checking ${skills.length} skill(s)...`)

  const failures = []

  for (const skill of skills) {
    const result = runAgentdock(['skill', 'validate', skill.dir, '--json'])

    if (result.error) {
      failures.push({
        id: skill.name,
        errors: [`failed to invoke agentdock CLI: ${result.error.message}`],
      })
      continue
    }

    let parsed
    try {
      // stdout may contain more than one line if the CLI prints anything else; the JSON
      // result is the last non-empty line in agent-mode output.
      const lines = result.stdout.split('\n').filter((l) => l.trim().length > 0)
      parsed = JSON.parse(lines[lines.length - 1] ?? '{}')
    } catch {
      failures.push({
        id: skill.name,
        errors: [
          `could not parse --json output from "agentdock skill validate ${skill.dir}"`,
          `stdout: ${result.stdout}`,
          `stderr: ${result.stderr}`,
        ],
      })
      continue
    }

    if (!parsed.ok) {
      failures.push({ id: skill.name, errors: parsed.errors ?? ['unknown validation error'] })
    }
  }

  if (failures.length === 0) {
    console.log(`gate ① (validate-all): ✓ all ${skills.length} skill(s) valid.`)
    process.exit(0)
  }

  console.error(`\ngate ① (validate-all): ✗ ${failures.length} skill(s) failed validation:\n`)
  for (const failure of failures) {
    console.error(`  skills/${failure.id}:`)
    for (const err of failure.errors) {
      console.error(`    - ${err}`)
    }
  }
  console.error('')
  process.exit(1)
}

main()
