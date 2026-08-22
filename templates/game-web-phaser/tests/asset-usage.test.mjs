// Tests for scripts/lib/asset-usage.mjs — asset-usage-gate design.
//
// 🔴 Three states, each with its own test, same discipline as
// tests/exit-decision.test.mjs:
//   1. `absent`      — no manifest declared anything. Must NOT fail.
//   2. `unavailable` — no snapshot even had an `assets` field. Must fail.
//   3. `judged`      — a real comparison ran, in its three shapes:
//        a. declared > 0, loaded === 0            -> fail
//        b. loaded > 0, usedInScene === 0          -> fail (THE bug this
//           gate exists to catch — see this file's own header)
//        c. loaded > 0, usedInScene > 0            -> pass
//
// Also covers the multi-snapshot union (title-screen snapshot + gameplay
// snapshot combining into one verdict) since that's load-bearing for how
// scripts/verify.mjs actually calls this.

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { judgeAssetUsage } from '../scripts/lib/asset-usage.mjs'

function snapshot({ declared = [], loaded = [], usedInScene = [] } = {}) {
  return { declared, loaded, usedInScene }
}

// ───────────────────────────────────────────────────────────────────────
// 1. absent
// ───────────────────────────────────────────────────────────────────────

test('every snapshot null -> absent, not a failure', () => {
  const result = judgeAssetUsage([null, null])
  assert.equal(result.status, 'absent')
})

test('empty snapshot list -> unavailable, not absent — no evidence was gathered at all, which is not the same as "asked and found nothing"', () => {
  // 🔴 Fail-closed per this template's own doctrine ("读不懂就判 unavailable，
  // 绝不默认通过"): an empty list means the caller never even attempted a
  // snapshot, which this function cannot distinguish from "something went
  // wrong before it could look" — it must not default to the benign `absent`.
  const result = judgeAssetUsage([])
  assert.equal(result.status, 'unavailable')
})

test('undefined input (caller passed nothing) -> unavailable, never throws', () => {
  const result = judgeAssetUsage(undefined)
  assert.equal(result.status, 'unavailable')
})

// ───────────────────────────────────────────────────────────────────────
// 2. unavailable
// ───────────────────────────────────────────────────────────────────────

test('every snapshot missing the "assets" field entirely -> unavailable, counts as a failure', () => {
  const result = judgeAssetUsage([undefined, undefined])
  assert.equal(result.status, 'unavailable')
  assert.match(result.reason, /predates the asset-usage gate/)
})

test('a mix of undefined and null is still resolved by the non-undefined entries (absent, not unavailable)', () => {
  // 🔴 This is the case where one snapshot attempt genuinely had no `assets`
  // field (e.g. only one bounds sample ran) but at least one other DID have
  // the field and reported no manifest — the field existing anywhere means
  // this harness build supports the gate, so it's `absent`, not `unavailable`.
  const result = judgeAssetUsage([null])
  assert.equal(result.status, 'absent')
})

// ───────────────────────────────────────────────────────────────────────
// 3. judged
// ───────────────────────────────────────────────────────────────────────

test('declared but nothing loaded -> judged, failed', () => {
  const declared = [{ key: 'bg-level1', kind: 'image' }, { key: 'bgm', kind: 'audio' }]
  const result = judgeAssetUsage([snapshot({ declared, loaded: [], usedInScene: [] })])
  assert.equal(result.status, 'judged')
  assert.equal(result.passed, false)
  assert.deepEqual(result.declared.sort(), ['bg-level1', 'bgm'])
  assert.deepEqual(result.loaded, [])
  assert.match(result.reason, /none of them made it into the texture\/audio cache/)
})

test('loaded but never drawn/played -> judged, failed — the real incident this gate exists to catch', () => {
  const declared = [{ key: 'bg-level1', kind: 'image' }, { key: 'player', kind: 'image' }]
  const result = judgeAssetUsage([snapshot({ declared, loaded: ['bg-level1', 'player'], usedInScene: [] })])
  assert.equal(result.status, 'judged')
  assert.equal(result.passed, false)
  assert.deepEqual(result.loaded.sort(), ['bg-level1', 'player'])
  assert.deepEqual(result.usedInScene, [])
  assert.match(result.reason, /nothing draws or plays them/)
})

test('loaded and used -> judged, passed', () => {
  const declared = [{ key: 'bg-level1', kind: 'image' }]
  const result = judgeAssetUsage([snapshot({ declared, loaded: ['bg-level1'], usedInScene: ['bg-level1'] })])
  assert.equal(result.status, 'judged')
  assert.equal(result.passed, true)
})

test('mutation check: a judge that treats "loaded but unused" as a pass has no discriminating power', () => {
  // This is the literal shape of the regression this gate exists to
  // prevent (the past real incident: BH-0/BH-1/BH-2/IA all green while
  // add.image was hit 0 times). A judge that doesn't fail this input isn't
  // testing anything.
  const declared = [{ key: 'bg-level1', kind: 'image' }]
  const brokenAlwaysPass = { ...snapshot({ declared, loaded: ['bg-level1'], usedInScene: [] }) }
  const result = judgeAssetUsage([brokenAlwaysPass])
  assert.equal(result.passed, false, 'declared+loaded but unused must never be reported as passed')
})

// ───────────────────────────────────────────────────────────────────────
// Multi-snapshot union — how scripts/verify.mjs actually calls this
// ───────────────────────────────────────────────────────────────────────

test('usage observed on a LATER snapshot (e.g. the gameplay-state probe) still counts, even if an earlier snapshot saw none', () => {
  const declared = [{ key: 'bg-level1', kind: 'image' }, { key: 'title', kind: 'image' }]
  // First snapshot: right after load, on the title/start screen — "title" is used, "bg-level1" is not yet.
  const first = snapshot({ declared, loaded: ['bg-level1', 'title'], usedInScene: ['title'] })
  // Second snapshot: after applyState() onto the gameplay state — "bg-level1" now shows up too.
  const second = snapshot({ declared, loaded: ['bg-level1', 'title'], usedInScene: ['bg-level1'] })
  const result = judgeAssetUsage([first, second])
  assert.equal(result.status, 'judged')
  assert.equal(result.passed, true)
  assert.deepEqual(result.usedInScene.sort(), ['bg-level1', 'title'])
})

test('declared/loaded stay stable across snapshots even if only one of them is passed', () => {
  const declared = [{ key: 'bgm', kind: 'audio' }]
  const result = judgeAssetUsage([snapshot({ declared, loaded: ['bgm'], usedInScene: ['bgm'] }), null])
  assert.equal(result.status, 'judged')
  assert.equal(result.passed, true)
  assert.deepEqual(result.declared, ['bgm'])
})
