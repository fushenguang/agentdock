import { NextRequest, NextResponse } from 'next/server'
import { getServerClient } from '@/infra/db/client'
import { defaultLocale } from '@/i18n/config'

const ALLOWED_NEXT = ['/reset-password']

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const nextParam = searchParams.get('next')

  // Whitelist check to prevent open redirect attacks
  const safePath = nextParam && ALLOWED_NEXT.includes(nextParam)
    ? nextParam
    : `/${defaultLocale}/dashboard`

  if (code) {
    const supabase = await getServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${safePath}`)
    }
  }

  return NextResponse.redirect(`${origin}/${defaultLocale}/login?error=auth_callback_error`)
}
