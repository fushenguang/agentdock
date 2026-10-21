import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import { X } from 'lucide-react-native'
import { Input, Text } from '../src/components/ui'

export default function SearchOverlay() {
  const [query, setQuery] = useState('')
  const router = useRouter()
  return (
    <View className="gap-4 px-5 pb-32 pt-4">
      <Text variant="display">Search</Text>
      <Input
        testID="search-input"
        autoFocus
        value={query}
        onChangeText={setQuery}
        placeholder="Search sessions, tasks, and domain objects"
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close search"
        className="absolute right-5 top-4 h-11 w-11 items-center justify-center rounded-full bg-surface"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      >
        <X size={18} color="#17211d" />
      </Pressable>
      <Text variant="muted">
        Search is an overlay. It never becomes a third primary desktop or a top-bar shortcut.
      </Text>
    </View>
  )
}
