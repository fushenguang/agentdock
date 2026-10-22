import { Link, Stack } from 'expo-router'
import type { ReactNode } from 'react'
import { Text, View } from 'react-native'
import { useLanguage } from '../settings/LanguageProvider'

export interface SecondaryScreenProps {
  title: string
  body: string
  children?: ReactNode
}

export function SecondaryScreen({ title, body, children }: SecondaryScreenProps) {
  const { t } = useLanguage()

  return (
    <>
      <Stack.Screen options={{ title }} />
      <View className="gap-4 px-5 pb-32 pt-4">
        <Link href="/user" className="text-sm text-accent">
          {t('user.title')}
        </Link>
        <Text className="text-3xl font-semibold text-ink">{title}</Text>
        <Text className="text-base text-ink">{body}</Text>
        {children}
      </View>
    </>
  )
}
