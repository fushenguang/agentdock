import { redirect } from '@/i18n/navigation'
import { getCurrentUser } from '@/features/auth/server'

export default async function ProtectedLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect({ href: '/login', locale })
  }

  return <>{children}</>
}
