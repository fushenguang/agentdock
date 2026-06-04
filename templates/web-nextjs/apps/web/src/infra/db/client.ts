import { createServerClient } from '@supabase/ssr'
import { createBrowserClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { NextRequest, NextResponse } from 'next/server'

/**
 * Returns a Supabase client safe for use in Server Components and Server Actions.
 *
 * Usage:
 * ```ts
 * // In a Server Component or Server Action:
 * const supabase = await getServerClient();
 * const { data } = await supabase.from('profiles').select('*');
 * ```
 *
 * Requires env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
export async function getServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        },
      },
    },
  )
}

/**
 * Returns a Supabase client safe for use in Client Components (browser).
 *
 * Usage:
 * ```ts
 * // In a 'use client' component:
 * const supabase = getBrowserClient();
 * const { data } = await supabase.from('greetings').select('*');
 * ```
 *
 * Requires env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
export function getBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

/**
 * Returns a Supabase client for use in middleware.
 * Reads and writes cookies via the provided request/response objects.
 *
 * Usage:
 * ```ts
 * // In middleware.ts:
 * const { supabase, response } = createMiddlewareClient(request, response)
 * await supabase.auth.getUser() // refreshes session token
 * ```
 */
export function createMiddlewareClient(
  request: NextRequest,
  response: NextResponse,
) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
    },
  )
  return { supabase, response }
}
