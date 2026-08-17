#!/usr/bin/env node
// gate ④ — license / provenance.
//
// Answers a question the other three gates don't: "do I have the right to publish this?"
//
//   gate ① asks "is the structure valid?"
//   gate ② asks "is the manifest fresh?"
//   gate ③ asks "did I leak MY identity?"
//
// A third-party copyright notice is orthogonal to all three — none of its characters belong
// to the host, so gate ③ never looks at it, and gate ① / ② don't either. This gate came out
// of a real incident (proposal.md's "Why"): gates ①②③ all green, 8 skills judged "clean" by
// gate ③, and 5 of those 8 turned out not to be the repo's own content — 2 vendor-proprietary
// ("all rights reserved", must never be forwarded), 3 Apache-2.0 (forwardable, but only with
// the original LICENSE/NOTICE kept, not silently relicensed to the repo's own MIT).
//
// For every skills/<name>/ directory, this gate collects three kinds of evidence and compares
// them against license-policy.json's declared repo license + forwarding whitelist:
//
//   1. LICENSE*/NOTICE* files directly inside the skill directory
//   2. SKILL.md frontmatter's `license` field, when it disagrees with the repo's own license
//   3. copyright-shaped strings (`© <year>`, `Copyright (c) <year>`, `All rights reserved`)
//      found anywhere in the skill directory's non-binary files
//
// Default stance is conservative: ANY evidence + no explicit registration in
// license-policy.json's `forwardedSkills` → fail. A registered forward still fails if its
// declared license isn't in the whitelist, if the declaration **contradicts the evidence
// actually found in the directory**, if the evidence says proprietary (no registration can
// override that), or if the original LICENSE*/NOTICE* file it's supposed to carry forward
// is missing.
//
// This gate does NOT make legal judgments (spec.md Non-goals) — it checks "is there evidence,
// and does it match what's declared", not "what does this license permit". The whitelist and
// the forwardedSkills registry are both data (license-policy.json), maintained by a human.
//
// Usage: node scripts/gates/license-provenance.mjs

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { listSkillDirs, REPO_ROOT } from './_lib.mjs'

const POLICY_PATH = join(REPO_ROOT, 'license-policy.json')

function loadPolicy() {
  if (!existsSync(POLICY_PATH)) {
    throw new Error(`license-policy.json not found at ${POLICY_PATH}`)
  }
  const raw = JSON.parse(readFileSync(POLICY_PATH, 'utf-8'))
  return {
    repoLicense: raw.repoLicense ?? '',
    allowedForwardLicenses: new Set(raw.allowedForwardLicenses?.ids ?? []),
    forwardedSkills: raw.forwardedSkills ?? {},
    licenseSignatures: (raw.licenseSignatures?.patterns ?? []).map((p) => ({
      name: p.name,
      kind: p.kind,
      regex: new RegExp(p.pattern),
    })),
    copyrightRegexes: (raw.copyrightPatterns?.patterns ?? []).map((p) => new RegExp(p)),
  }
}

/** Same null-byte sniff gate ③ uses — good enough to skip fonts/binaries without a dependency. */
function isProbablyBinary(buf) {
  const len = Math.min(buf.length, 8000)
  for (let i = 0; i < len; i++) {
    if (buf[i] === 0) return true
  }
  return false
}

/** Recursively lists every file under `dir`, relative paths, skipping node_modules. */
function walkFiles(dir, base = dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue
    const abs = join(dir, name)
    const st = statSync(abs)
    if (st.isDirectory()) {
      out.push(...walkFiles(abs, base))
    } else if (st.isFile()) {
      out.push(relative(base, abs))
    }
  }
  return out
}

/** Reads a SKILL.md's top-level frontmatter `license:` field. Returns '' if absent/unreadable.
 *  Deliberately minimal — scoped to this one key, not a general YAML parser (same posture as
 *  align-check's roadmap.yaml reader: covers the one format this repo actually produces). */
function readFrontmatterLicense(skillMdPath) {
  if (!existsSync(skillMdPath)) return ''
  const content = readFileSync(skillMdPath, 'utf-8')
  const lines = content.split('\n')
  if (lines[0]?.trim() !== '---') return ''
  const closeIdx = lines.slice(1).findIndex((l) => l.trim() === '---')
  if (closeIdx === -1) return ''
  const frontmatter = lines.slice(1, 1 + closeIdx)
  for (const line of frontmatter) {
    const m = /^license:\s*(.+)\s*$/.exec(line)
    if (m) return m[1].trim().replace(/^["']|["']$/g, '')
  }
  return ''
}

function detectSignature(text, signatures) {
  for (const sig of signatures) {
    if (sig.regex.test(text)) return sig
  }
  return null
}

/** Collects evidence for one skill directory. */
function inspectSkill(skill, policy) {
  const evidence = []
  const allFiles = walkFiles(skill.dir)

  // 1. LICENSE*/NOTICE* directly inside the skill dir (not nested — matches spec's "目录内").
  const topLevelNames = readdirSync(skill.dir)
  const licenseFiles = topLevelNames.filter((n) => /^LICENSE/i.test(n))
  const noticeFiles = topLevelNames.filter((n) => /^NOTICE/i.test(n))
  if (licenseFiles.length > 0 || noticeFiles.length > 0) {
    evidence.push({
      type: 'license-file',
      detail: [...licenseFiles, ...noticeFiles].map((n) => `skills/${skill.name}/${n}`),
    })
  }

  // 2. frontmatter `license` field, when it disagrees with the repo's declared license.
  const skillMdPath = join(skill.dir, 'SKILL.md')
  const frontmatterLicense = readFrontmatterLicense(skillMdPath)
  if (frontmatterLicense && frontmatterLicense.toLowerCase() !== policy.repoLicense.toLowerCase()) {
    evidence.push({
      type: 'frontmatter-license',
      detail: [`skills/${skill.name}/SKILL.md frontmatter license: "${frontmatterLicense}"`],
    })
  }

  // 3. copyright-shaped text anywhere under the skill dir (non-binary files only).
  const copyrightHits = []
  for (const relPath of allFiles) {
    const abs = join(skill.dir, relPath)
    let buf
    try {
      buf = readFileSync(abs)
    } catch {
      continue
    }
    if (isProbablyBinary(buf)) continue
    const content = buf.toString('utf-8')
    const lines = content.split('\n')
    for (let i = 0; i < lines.length; i++) {
      for (const regex of policy.copyrightRegexes) {
        regex.lastIndex = 0
        if (regex.test(lines[i])) {
          copyrightHits.push({
            file: `skills/${skill.name}/${relPath}`,
            line: i + 1,
            excerpt: lines[i].trim().slice(0, 160),
          })
          break // one hit per line is enough
        }
      }
    }
  }
  if (copyrightHits.length > 0) {
    evidence.push({
      type: 'copyright-text',
      detail: copyrightHits.map((h) => `${h.file}:${h.line}  ${h.excerpt}`),
      hits: copyrightHits,
    })
  }

  // Classify what license the evidence looks like. ★ This IS gating: a registered forward's
  // declared license is cross-checked against it, and `kind: proprietary` can never be
  // registered away. Without that, filling in forwardedSkills with a whitelisted id would
  // launder proprietary content straight through the gate.
  let detected = null
  for (const name of [...licenseFiles, ...noticeFiles]) {
    const abs = join(skill.dir, name)
    try {
      const text = readFileSync(abs, 'utf-8')
      detected = detectSignature(text, policy.licenseSignatures)
      if (detected) break
    } catch {
      // binary/unreadable LICENSE file — leave undetected
    }
  }
  if (!detected) {
    for (const hit of copyrightHits) {
      detected = detectSignature(hit.excerpt, policy.licenseSignatures)
      if (detected) break
    }
  }
  if (!detected && frontmatterLicense) {
    detected = detectSignature(frontmatterLicense, policy.licenseSignatures)
  }

  return { evidence, detected }
}

function main() {
  const policy = loadPolicy()
  const skills = listSkillDirs(REPO_ROOT)

  if (skills.length === 0) {
    console.log('gate ④ (license-provenance): no skills under skills/ — nothing to check.')
    process.exit(0)
  }

  console.log(`gate ④ (license-provenance): checking ${skills.length} skill(s)...`)

  const selfOwned = []
  const failures = []
  const forwardedOk = []

  for (const skill of skills) {
    const { evidence, detected } = inspectSkill(skill, policy)

    if (evidence.length === 0) {
      selfOwned.push(skill.name)
      continue
    }

    const registration = policy.forwardedSkills[skill.name]
    const label = detected ? `${detected.name} (${detected.kind})` : 'unidentified third-party'

    if (!registration) {
      failures.push({
        id: skill.name,
        reason: `has third-party evidence (${label}) but is not registered in license-policy.json's forwardedSkills`,
        evidence,
      })
      continue
    }

    if (!policy.allowedForwardLicenses.has(registration.originalLicense)) {
      failures.push({
        id: skill.name,
        reason: `registered forward declares originalLicense "${registration.originalLicense}", which is not in license-policy.json's allowedForwardLicenses — proprietary/unlisted licenses may never be forwarded`,
        evidence,
      })
      continue
    }

    // ★ 声明必须与**检测到的证据**一致，否则登记本身就成了洗白通道。
    //
    // 这条不是设想：本门第一版只信 `originalLicense` 的声明 + 查许可文件在不在，
    // 于是把一个「保留所有权利」的 skill 登记成 `MIT` 就能让它通过——
    // 恰好绕过本门自称要防的那件事（「拦住一次把别人的专有内容推成公开开源」）。
    // 填这张表的人只要猜错一次（或图省事随手填一个白名单里的 id），门就静默失效。
    //
    // 因此：检测到具体许可时，声明必须与它相符；检测到专有时，**任何声明都不得放行**。
    if (detected && detected.kind === 'proprietary') {
      failures.push({
        id: skill.name,
        reason: `evidence in this skill says it is proprietary, but it is registered as a "${registration.originalLicense}" forward — a registration can never override proprietary evidence. Remove the skill, or fix the evidence if it is wrong.`,
        evidence,
      })
      continue
    }
    if (detected && detected.name && detected.name !== registration.originalLicense) {
      failures.push({
        id: skill.name,
        reason: `registered as a "${registration.originalLicense}" forward, but the evidence found in the skill says "${detected.name}" — the declaration must match what is actually in the directory`,
        evidence,
      })
      continue
    }

    const topLevelNames = readdirSync(skill.dir)
    const hasLicenseFile = topLevelNames.some((n) => /^LICENSE/i.test(n))
    if (!hasLicenseFile) {
      failures.push({
        id: skill.name,
        reason: `registered as a third-party forward (${registration.originalLicense}) but has no LICENSE* file in skills/${skill.name}/ — forwarding must not drop the original license`,
        evidence,
      })
      continue
    }

    if (registration.requiresNotice) {
      const hasNoticeFile = topLevelNames.some((n) => /^NOTICE/i.test(n))
      if (!hasNoticeFile) {
        failures.push({
          id: skill.name,
          reason: `registered as a third-party forward with requiresNotice: true but has no NOTICE* file in skills/${skill.name}/`,
          evidence,
        })
        continue
      }
    }

    forwardedOk.push({ id: skill.name, license: registration.originalLicense })
  }

  console.log(`\ngate ④ (license-provenance): ${selfOwned.length} skill(s) judged self-owned:`)
  for (const id of selfOwned) console.log(`  - ${id}`)

  if (forwardedOk.length > 0) {
    console.log(
      `\ngate ④ (license-provenance): ${forwardedOk.length} skill(s) registered + verified as third-party forwards:`,
    )
    for (const f of forwardedOk) console.log(`  - ${f.id} (${f.license})`)
  }

  if (failures.length === 0) {
    console.log(`\ngate ④ (license-provenance): ✓ all ${skills.length} skill(s) accounted for.`)
    process.exit(0)
  }

  console.error(`\ngate ④ (license-provenance): ✗ ${failures.length} skill(s) failed:\n`)
  for (const failure of failures) {
    console.error(`  skills/${failure.id}: ${failure.reason}`)
    for (const item of failure.evidence) {
      console.error(`    [${item.type}]`)
      for (const line of item.detail) console.error(`      ${line}`)
    }
  }
  console.error('')
  console.error('  If a skill is genuinely a permitted third-party forward, register it under')
  console.error('  `forwardedSkills` in license-policy.json (originalLicense must be in')
  console.error('  `allowedForwardLicenses`) and keep its original LICENSE*/NOTICE* file in place.')
  console.error('  If it is proprietary, it MUST NOT be forwarded into this repo at all.\n')
  process.exit(1)
}

main()
