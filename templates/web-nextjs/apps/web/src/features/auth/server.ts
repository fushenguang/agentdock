import { cache } from 'react'
import { getServerClient } from '@/infra/db/client'

/**
 * Returns the current authenticated user for the active request.
 * Wrapped in React cache() so repeated reads in one request are deduplicated.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await getServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
})
