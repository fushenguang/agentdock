import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import { X } from 'lucide-react-native'
import { useLanguage } from '../src/components/settings/LanguageProvider'
import { Input, Text } from '../src/components/ui'

export default function SearchOverlay() {
  const [query, setQuery] = useState('')
  const router = useRouter()
  const { t } = useLanguage()
  return (
    <View className="gap-4 px-5 pb-32 pt-4">
      <Text variant="display">{t('search.title')}</Text>
      <Input
        testID="search-input"
        autoFocus
        value={query}
        onChangeText={setQuery}
        placeholder={t('search.placeholder')}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('search.close')}
        className="absolute right-5 top-4 h-11 w-11 items-center justify-center rounded-full bg-surface"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      >
        <X size={18} color="#17211d" />
      </Pressable>
      <Text variant="muted">{t('search.description')}</Text>
    </View>
  )
}
