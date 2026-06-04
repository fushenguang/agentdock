import { NextRequest, NextResponse } from 'next/server'
import { getServerClient } from '@/infra/db/client'
import { defaultLocale } from '@/i18n/config'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const nextParam = searchParams.get('next')
  const next = nextParam && nextParam.startsWith('/') ? nextParam : `/${defaultLocale}/dashboard`

  if (code) {
    const supabase = await getServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/${defaultLocale}/login?error=auth_callback_error`)
}
