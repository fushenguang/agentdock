import { Pressable, View } from 'react-native'
import { SecondaryScreen } from '../../src/components/shell/SecondaryScreen'
import { INTERFACE_LANGUAGES, useLanguage } from '../../src/components/settings/LanguageProvider'
import { AppIcon, DetailCard, Section, Text } from '../../src/components/ui'
import { successFeedback, tapFeedback } from '../../src/lib/haptics'

export default function ProfileScreen() {
  const { t, language, setLanguage } = useLanguage()
  const options = [
    {
      value: INTERFACE_LANGUAGES.chinese,
      label: t('settings.chinese'),
      accessibilityLabel: t('settings.selectChinese'),
    },
    {
      value: INTERFACE_LANGUAGES.english,
      label: t('settings.english'),
      accessibilityLabel: t('settings.selectEnglish'),
    },
  ] as const

  return (
    <SecondaryScreen
      title={t('user.profile')}
      body={t('user.profileBody')}
      icon="profile"
      tone="violet"
    >
      <Section title={t('settings.language')}>
        <View className="gap-3">
          {options.map((option) => {
            const selected = language === option.value
            return (
              <Pressable
                key={option.value}
                testID={`language-${option.value}`}
                accessibilityRole="button"
                accessibilityLabel={option.accessibilityLabel}
                accessibilityState={{ selected }}
                className={`flex-row items-center gap-3 rounded-[28px] border p-4 ${
                  selected ? 'border-accent bg-accentSoft' : 'border-white/70 bg-white/74'
                }`}
                onPress={() => {
                  tapFeedback()
                  setLanguage(option.value)
                  successFeedback()
                }}
              >
                <View className="flex-1">
                  <Text className="text-base font-semibold text-ink">{option.label}</Text>
                  <Text className="mt-1 text-xs text-muted">
                    {t('settings.languageDescription')}
                  </Text>
                </View>
                {selected ? <AppIcon name="check" size={20} color="#b8731f" /> : null}
              </Pressable>
            )
          })}
        </View>
      </Section>
      <DetailCard
        icon="user"
        tone="sky"
        title={t('settings.identityTitle')}
        body={t('settings.identityBody')}
      />
      <View className="rounded-[28px] border border-white/70 bg-white/74 px-5 py-4">
        <Text className="text-xs font-semibold uppercase text-muted">{t('settings.version')}</Text>
        <Text className="mt-1 text-lg font-semibold text-ink">0.1.0</Text>
      </View>
    </SecondaryScreen>
  )
}
