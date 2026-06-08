import crypto from 'crypto'

/**
 * Generates a unique order number in the format WN{timestamp}{4-digit-random}
 * WN = WebNextjs prefix to avoid conflicts with other projects
 */
export function generateOrderNumber(): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0')
  return `WN${timestamp}${random}`
}

/**
 * Formats a price in cents to a human-readable currency string (CNY)
 */
export function formatPriceInCents(cents: number): string {
  return `¥${(cents / 100).toFixed(2)}`
}

/**
 * Checks if a subscription is currently active
 */
export function isSubscriptionActive(status: string): boolean {
  return status === 'trial' || status === 'active'
}
