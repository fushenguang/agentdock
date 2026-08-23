// Unit tests for the pure half of scripts/playtest.mjs — argument parsing,
// default-state selection, and the entity delta formatter.
//
// The browser half is deliberately not unit-tested (it needs a real Chromium);
// what IS testable is exactly the part that would rot silently, so it's covered
// here rather than left to "it worked when I ran it once".
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { parseArgs, pickDefaultState, formatEntityDelta } from '../scripts/playtest.mjs'

test('parseArgs: defaults', () => {
  const o = parseArgs([])
  assert.equal(o.state, null)
  assert.deepEqual(o.press, [])
  assert.equal(o.pressMs, 600)
  // 🔴 settle must never default to 0 — applyState() resolves before the scene
  // is live, and reading too early makes a working jump look broken.
  assert.equal(o.settleMs, 400)
  assert.equal(o.trigger, null)
  assert.equal(o.seed, 1)
})

test('parseArgs: every flag', () => {
  const o = parseArgs([
    '--state', 'Level3', '--press', 'ArrowRight, Space ,', '--ms', '800',
    '--settle', '250', '--trigger', 'goal', '--shot', 'out.png', '--seed', '7',
  ])
  assert.equal(o.state, 'Level3')
  assert.deepEqual(o.press, ['ArrowRight', 'Space'])   // trimmed, empties dropped
  assert.equal(o.pressMs, 800)
  assert.equal(o.settleMs, 250)
  assert.equal(o.trigger, 'goal')
  assert.equal(o.shot, 'out.png')
  assert.equal(o.seed, 7)
})

test('pickDefaultState: picks the LAST gameplay state, not the first', () => {
  // A multi-level game lists its levels in order; "can the player still reach
  // the goal in the FINAL level?" is the question worth asking automatically.
  const states = [
    { id: 'Boot', role: 'other' },
    { id: 'Level1', role: 'gameplay' },
    { id: 'Level5', role: 'gameplay' },
    { id: 'GameOver', role: 'gameover' },
  ]
  assert.equal(pickDefaultState(states), 'Level5')
})

test('pickDefaultState: no gameplay state -> null (caller reports, never guesses)', () => {
  assert.equal(pickDefaultState([{ id: 'Boot', role: 'other' }]), null)
})

test('formatEntityDelta: movement, stillness, appearance, disappearance', () => {
  const before = [
    { name: 'player', x: 100, y: 200 },
    { name: 'rock', x: 10, y: 10 },
    { name: 'gone', x: 1, y: 1 },
  ]
  const after = [
    { name: 'player', x: 260, y: 200 },
    { name: 'rock', x: 10, y: 10 },
    { name: 'coin', x: 50, y: 50 },
  ]
  const lines = formatEntityDelta(before, after).join('\n')

  assert.match(lines, /~ player: \(100\.0, 200\.0\) -> \(260\.0, 200\.0\)\s+dx=160\.0 dy=0\.0/)
  // 🔴 "did not move" must be stated explicitly — a silent `dx=0.0` reads the
  // same as "I didn't check", and this script exists to remove that ambiguity.
  assert.match(lines, /= rock: .*did not move/)
  assert.match(lines, /\+ coin: appeared at \(50\.0, 50\.0\)/)
  // An entity vanishing is reported, never skipped: "the player object stopped
  // existing" is exactly what this instrument is for.
  assert.match(lines, /- gone: disappeared/)
})

test('formatEntityDelta: sub-pixel jitter counts as "did not move"', () => {
  const lines = formatEntityDelta(
    [{ name: 'player', x: 100, y: 100 }],
    [{ name: 'player', x: 100.3, y: 100.2 }],
  ).join('\n')
  assert.match(lines, /did not move/)
})
