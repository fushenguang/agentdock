import { cache } from 'react'
// eslint-disable-next-line no-restricted-imports -- Infrastructure helper for reading current session; returns raw Supabase user with metadata
import { getServerClient } from '@/infra/db/client'

/**
 * Returns the current authenticated user for the active request.
 * Wrapped in React cache() so repeated reads in one request are deduplicated.
 * Note: This is an infrastructure helper that returns the raw Supabase user
 * object (including user_metadata) for use in Server Components.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await getServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
})
