import { redirect } from 'next/navigation'
import { defaultLocale } from '@/i18n/config'

export default function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  return (async () => {
    const { locale } = await params
    redirect(`/${locale}/settings/profile`)
  })()
}
