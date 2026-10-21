import { Link } from 'expo-router'
import { ScrollView, Text } from 'react-native'

const USER_ROUTES = [
  { href: '/user/profile', title: 'Profile' },
  { href: '/user/privacy', title: 'Privacy' },
  { href: '/user/storage', title: 'Storage' },
  { href: '/user/sync', title: 'Sync' },
  { href: '/user/notifications', title: 'Notifications' },
  { href: '/user/about', title: 'About' },
] as const

export default function UserDesktop() {
  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-4 px-5 pb-32 pt-4">
      <Text className="text-3xl font-semibold text-ink">User</Text>
      {USER_ROUTES.map((route) => (
        <Link key={route.href} href={route.href} className="rounded-3xl bg-surface p-5">
          <Text className="text-base font-medium text-ink">{route.title}</Text>
        </Link>
      ))}
    </ScrollView>
  )
}
