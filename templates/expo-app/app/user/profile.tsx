import { Pressable, Text, View } from 'react-native'
import { SecondaryScreen } from '../../src/components/shell/SecondaryScreen'
import { INTERFACE_LANGUAGES, useLanguage } from '../../src/components/settings/LanguageProvider'

export default function ProfileScreen() {
  const { t, language, setLanguage } = useLanguage()
  const languageOptions = [
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
    <SecondaryScreen title={t('user.profile')} body={t('user.profileBody')}>
      <View className="mt-6 gap-3">
        <Text className="text-xs uppercase text-muted">{t('settings.language')}</Text>
        <Text className="text-sm text-muted">{t('settings.languageDescription')}</Text>
        <View className="gap-2">
          {languageOptions.map((option) => (
            <Pressable
              key={option.value}
              testID={`language-${option.value}`}
              accessibilityRole="button"
              accessibilityLabel={option.accessibilityLabel}
              accessibilityState={{ selected: language === option.value }}
              className={`rounded-2xl px-4 py-3 ${
                language === option.value ? 'bg-accent/10' : 'bg-surface'
              }`}
              onPress={() => setLanguage(option.value)}
            >
              <Text className="text-base font-medium text-ink">{option.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </SecondaryScreen>
  )
}
