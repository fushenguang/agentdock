import { NextResponse } from 'next/server'
import { defaultLocale } from '@/i18n/config'

/**
 * Handles GET / — next-intl middleware should redirect to /${defaultLocale}
 * first, but this route handler is the belt-and-suspenders fallback for edge
 * cases where the middleware matcher doesn't fire (e.g. Turbopack dev quirks).
 */
export function GET(request: Request) {
  const url = new URL(request.url)
  url.pathname = `/${defaultLocale}`
  return NextResponse.redirect(url, { status: 307 })
}
