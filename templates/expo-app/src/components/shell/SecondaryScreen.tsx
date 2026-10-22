import { Stack, useRouter } from 'expo-router'
import type { ReactNode } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { tapFeedback } from '../../lib/haptics'
import { useLanguage } from '../settings/LanguageProvider'
import { AppIcon, GlassCard, IconBadge, Text, type AppIconName, type IconTone } from '../ui'

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
  const router = useRouter()
  const { t } = useLanguage()

  function goBackToUser() {
    tapFeedback()
    if (router.canGoBack()) router.back()
    else router.navigate('/user')
  }

  return (
    <>
      <Stack.Screen options={{ title }} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 px-5 pb-36 pt-4"
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          testID="secondary-user-back"
          accessibilityRole="button"
          accessibilityLabel={t('user.title')}
          className="flex-row items-center gap-2 self-start rounded-full bg-white/70 px-3 py-2 active:bg-white"
          onPress={goBackToUser}
        >
          <AppIcon name="back" size={15} color="#b8731f" />
          <Text className="text-sm font-medium text-accentDark">{t('user.title')}</Text>
        </Pressable>
        <GlassCard className="p-5">
          <View className="flex-row items-center gap-4">
            <IconBadge icon={icon} tone={tone} size={54} />
            <View className="flex-1 gap-1">
              <Text variant="display">{title}</Text>
              <Text className="text-sm leading-5 text-muted">{body}</Text>
            </View>
          </View>
        </GlassCard>
        {children}
      </ScrollView>
    </>
  )
}
