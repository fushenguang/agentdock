import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readlinkSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { syncAgentSkillLinks } from '../tools/sync-agent-skills.mjs'

test('links every .agents skill into .claude/skills', () => {
  const root = mkdtempSync(join(tmpdir(), 'agentdock-skill-links-'))
  try {
    for (const name of ['b-skill', 'a-skill']) {
      mkdirSync(join(root, '.agents', 'skills', name), { recursive: true })
      writeFileSync(join(root, '.agents', 'skills', name, 'SKILL.md'), `# ${name}\n`)
    }
    assert.deepEqual(syncAgentSkillLinks(root), ['a-skill', 'b-skill'])
    assert.equal(
      readlinkSync(join(root, '.claude', 'skills', 'a-skill')),
      '../../.agents/skills/a-skill',
    )
    assert.equal(
      readlinkSync(join(root, '.claude', 'skills', 'b-skill')),
      '../../.agents/skills/b-skill',
    )
    assert.deepEqual(syncAgentSkillLinks(root), ['a-skill', 'b-skill'])
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
