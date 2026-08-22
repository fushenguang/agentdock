import type { MinimaxClient, MinimaxQuotaModelRemain, MinimaxQuotaResponse } from './client.js'

export type { MinimaxQuotaModelRemain, MinimaxQuotaResponse }

/** Thin wrapper over `quota.info()` — kept as a function (not a re-export)
 * so callers depend on this package's surface, not `mmx-cli`'s. */
export async function getQuota(client: MinimaxClient): Promise<MinimaxQuotaResponse> {
  return client.quota.info()
}

function findModelQuota(
  quota: MinimaxQuotaResponse,
  modelName: string,
): MinimaxQuotaModelRemain {
  const entry = quota.model_remains.find((m) => m.model_name === modelName)
  if (!entry) {
    throw new Error(`No quota entry for model "${modelName}" in MiniMax quota response.`)
  }
  return entry
}

/**
 * Whether `modelName`'s current-interval quota is exhausted.
 *
 * Prefers `current_interval_remaining_percent` (the field MiniMax's own
 * dashboard is presumably driven by) when present, and falls back to
 * comparing usage against the total count otherwise — both fields are
 * present in the real `quota.info()` response, but
 * `current_interval_remaining_percent` is documented as optional.
 *
 * Throws (rather than returning `false`) when `modelName` has no entry at
 * all — silently treating "model not found" as "not exhausted" would be a
 * false negative that could mask a real outage.
 */
export function isQuotaExhausted(quota: MinimaxQuotaResponse, modelName: string): boolean {
  const entry = findModelQuota(quota, modelName)
  if (typeof entry.current_interval_remaining_percent === 'number') {
    return entry.current_interval_remaining_percent <= 0
  }
  return entry.current_interval_usage_count >= entry.current_interval_total_count
}

/**
 * Milliseconds until `modelName`'s current-interval quota resets.
 *
 * This is the number we didn't have the last time we ran into a MiniMax
 * rate limit and ended up idling for a flat 30 minutes because nothing
 * read `remains_time` — see this package's PR description.
 */
export function msUntilReset(quota: MinimaxQuotaResponse, modelName: string): number {
  const entry = findModelQuota(quota, modelName)
  return entry.remains_time * 1000
}
