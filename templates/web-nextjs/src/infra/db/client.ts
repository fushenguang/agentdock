import { createServerClient } from "@supabase/ssr";
import { createBrowserClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Returns a Supabase client safe for use in Server Components and Server Actions.
 *
 * Usage:
 * ```ts
 * // In a Server Component or Server Action:
 * const supabase = await getServerClient();
 * const { data } = await supabase.from('greetings').select('*');
 * ```
 *
 * Requires env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
export async function getServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    }
  );
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
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
