import createMiddleware from 'next-intl/middleware'
import { defineRouting } from 'next-intl/routing'
import { NextResponse, type NextRequest } from 'next/server'
import { createMiddlewareClient } from '@/infra/db/client'
import { defaultLocale, isLocale, locales } from '@/i18n/config'

export const routing = defineRouting({
  locales,
  defaultLocale,
})

const handleI18nRouting = createMiddleware(routing)

function copyCookies(from: NextResponse, to: NextResponse) {
  for (const cookie of from.cookies.getAll()) {
    to.cookies.set(cookie)
  }
}

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = `/${defaultLocale}`
    return NextResponse.redirect(url)
  }

  // Skip Supabase session refresh for the auth callback route
  // (it's handled by the route handler itself)
  if (pathname.startsWith('/auth/')) {
    return NextResponse.next()
  }

  // 1. Let next-intl build the final response first.
  // Supabase cookie refresh should write into this response to avoid cookie loss.
  const response = handleI18nRouting(request)

  // 2. Refresh the Supabase session (keeps token alive, writes updated cookie)
  const { supabase } = createMiddlewareClient(request, response)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 3. Redirect authenticated users away from auth pages (/(auth)/ routes)
  const authPagePattern = /^\/[a-z]{2}\/(login|signup)(\/|$)/
  if (user && authPagePattern.test(pathname)) {
    const localeSegment = pathname.split('/')[1] ?? defaultLocale
    const locale = isLocale(localeSegment) ? localeSegment : defaultLocale
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}/dashboard`
    const redirectResponse = NextResponse.redirect(url)
    copyCookies(response, redirectResponse)
    return redirectResponse
  }

  // 4. Normalize unknown locale-like prefixes: /fr/hello -> /en/hello
  const segments = pathname.split('/').filter(Boolean)
  const firstSegment = segments[0]

  if (firstSegment !== undefined) {
    const isLocaleLike = /^[a-z]{2}(?:-[A-Z]{2})?$/.test(firstSegment)
    const isSupportedLocale = isLocale(firstSegment)

    if (isLocaleLike && !isSupportedLocale) {
      const url = request.nextUrl.clone()
      url.pathname = `/${routing.defaultLocale}/${segments.slice(1).join('/')}`.replace(/\/$/, '')
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  // Match all pathnames except Next.js internals, static files, and auth callback.
  matcher: ['/((?!_next|_vercel|auth/callback|.*\\..*).*)'],
}
