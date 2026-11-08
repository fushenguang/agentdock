#!/usr/bin/env node

import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readlinkSync,
  rmSync,
  symlinkSync,
} from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

export function syncAgentSkillLinks(root = process.cwd()) {
  const skillsRoot = join(resolve(root), '.agents', 'skills')
  const linksRoot = join(resolve(root), '.claude', 'skills')
  if (!existsSync(skillsRoot)) throw new Error(`missing ${skillsRoot}`)
  mkdirSync(linksRoot, { recursive: true })

  const linked = []
  for (const name of readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()) {
    const link = join(linksRoot, name)
    const target = `../../.agents/skills/${name}`
    let existing = null
    try {
      existing = lstatSync(link)
    } catch {
      // Missing links are created below.
    }
    if (existing) {
      if (!existing.isSymbolicLink()) {
        throw new Error(`refusing to replace non-symlink ${link}`)
      }
      if (readlinkSync(link) === target) {
        linked.push(name)
        continue
      }
      rmSync(link)
    }
    symlinkSync(target, link, 'dir')
    linked.push(name)
  }
  return linked
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const linked = syncAgentSkillLinks()
  console.log(`Linked ${linked.length} agent skill(s) for Claude Code`)
}
