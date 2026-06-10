import { redirect } from '@/i18n/navigation'
import { defaultLocale } from '@/i18n/config'

export default function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  return (async () => {
    const { locale } = await params
    redirect({ href: '/settings/profile', locale })
  })()
}
