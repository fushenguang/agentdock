import { describe, expect, it } from 'vitest'

import { isQuotaExhausted, msUntilReset } from './quota.js'
import type { MinimaxQuotaResponse } from './client.js'

function quotaWith(model: Partial<MinimaxQuotaResponse['model_remains'][number]>): MinimaxQuotaResponse {
  return {
    model_remains: [
      {
        model_name: 'MiniMax-M3',
        remains_time: 1800,
        current_interval_total_count: 100,
        current_interval_usage_count: 0,
        ...model,
      },
    ],
  }
}

describe('isQuotaExhausted', () => {
  it('is exhausted when current_interval_remaining_percent is exactly 0 (boundary)', () => {
    const quota = quotaWith({ current_interval_remaining_percent: 0 })
    expect(isQuotaExhausted(quota, 'MiniMax-M3')).toBe(true)
  })

  it('is not exhausted when current_interval_remaining_percent is just above 0', () => {
    const quota = quotaWith({ current_interval_remaining_percent: 0.01 })
    expect(isQuotaExhausted(quota, 'MiniMax-M3')).toBe(false)
  })

  it('treats a negative remaining percent as exhausted too', () => {
    const quota = quotaWith({ current_interval_remaining_percent: -1 })
    expect(isQuotaExhausted(quota, 'MiniMax-M3')).toBe(true)
  })

  it('falls back to usage >= total when remaining percent is absent — exhausted at the boundary (usage == total)', () => {
    const quota = quotaWith({
      current_interval_usage_count: 100,
      current_interval_total_count: 100,
    })
    expect(isQuotaExhausted(quota, 'MiniMax-M3')).toBe(true)
  })

  it('falls back to usage < total as not exhausted (one below the boundary)', () => {
    const quota = quotaWith({
      current_interval_usage_count: 99,
      current_interval_total_count: 100,
    })
    expect(isQuotaExhausted(quota, 'MiniMax-M3')).toBe(false)
  })

  it('throws for a model with no quota entry, rather than silently reporting "not exhausted"', () => {
    const quota = quotaWith({})
    expect(() => isQuotaExhausted(quota, 'unknown-model')).toThrow(/No quota entry/)
  })
})

describe('msUntilReset', () => {
  it('converts remains_time (seconds) to milliseconds', () => {
    const quota = quotaWith({ remains_time: 1800 })
    expect(msUntilReset(quota, 'MiniMax-M3')).toBe(1_800_000)
  })

  it('returns 0 at the boundary when remains_time is 0', () => {
    const quota = quotaWith({ remains_time: 0 })
    expect(msUntilReset(quota, 'MiniMax-M3')).toBe(0)
  })

  it('throws for a model with no quota entry', () => {
    const quota = quotaWith({})
    expect(() => msUntilReset(quota, 'unknown-model')).toThrow(/No quota entry/)
  })
})
