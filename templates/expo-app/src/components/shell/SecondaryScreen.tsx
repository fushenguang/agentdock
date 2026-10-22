import { Link, Stack } from 'expo-router'
import type { ReactNode } from 'react'
import { ScrollView, View } from 'react-native'
import { useLanguage } from '../settings/LanguageProvider'
import {
  AppIcon,
  DetailCard,
  GlassCard,
  IconBadge,
  Text,
  type AppIconName,
  type IconTone,
} from '../ui'

export interface SecondaryScreenProps {
  title: string
  body: string
  icon: AppIconName
  tone?: IconTone
  children?: ReactNode
}

export function SecondaryScreen({
  title,
  body,
  icon,
  tone = 'amber',
  children,
}: SecondaryScreenProps) {
  const { t } = useLanguage()

  return (
    <>
      <Stack.Screen options={{ title }} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 px-5 pb-36 pt-4"
        showsVerticalScrollIndicator={false}
      >
        <Link href="/user" className="flex-row items-center gap-2 self-start" asChild>
          <View className="flex-row items-center gap-2 rounded-full bg-white/70 px-3 py-2">
            <AppIcon name="back" size={15} color="#b8731f" />
            <Text className="text-sm font-medium text-accentDark">{t('user.title')}</Text>
          </View>
        </Link>
        <GlassCard className="p-5">
          <View className="gap-4">
            <IconBadge icon={icon} tone={tone} size={58} />
            <Text variant="display">{title}</Text>
            <Text className="text-base leading-6 text-inkSoft">{body}</Text>
          </View>
        </GlassCard>
        {children}
      </ScrollView>
    </>
  )
}
