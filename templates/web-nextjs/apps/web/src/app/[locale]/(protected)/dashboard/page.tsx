import { getTranslations } from 'next-intl/server'
import { getServerClient } from '@/infra/db/client'
import { signOut } from '@/features/auth'
import { Button } from '@/components/ui/button'

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth' })
  const supabase = await getServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-semibold">{t('dashboardTitle')}</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <form action={signOut}>
              <input type="hidden" name="locale" value={locale} />
              <Button type="submit" variant="outline" size="sm">
                {t('signOutButton')}
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <p className="text-muted-foreground">
          {t('dashboardWelcome', { email: user?.email ?? '' })}
        </p>
      </main>
    </div>
  )
}
