import { Link } from 'expo-router'
import { ScrollView, Text } from 'react-native'
import { useLanguage } from '../../src/components/settings/LanguageProvider'

export default function UserDesktop() {
  const { t } = useLanguage()
  const userRoutes = [
    { href: '/user/profile', title: t('user.profile') },
    { href: '/user/privacy', title: t('user.privacy') },
    { href: '/user/storage', title: t('user.storage') },
    { href: '/user/sync', title: t('user.sync') },
    { href: '/user/notifications', title: t('user.notifications') },
    { href: '/user/about', title: t('user.about') },
  ] as const

  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-4 px-5 pb-32 pt-4">
      <Text className="text-3xl font-semibold text-ink">{t('user.title')}</Text>
      {userRoutes.map((route) => (
        <Link key={route.href} href={route.href} className="rounded-3xl bg-surface p-5">
          <Text className="text-base font-medium text-ink">{route.title}</Text>
        </Link>
      ))}
    </ScrollView>
  )
}
