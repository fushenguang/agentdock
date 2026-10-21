import { useState } from 'react'
import { View } from 'react-native'
import { Input, Text } from '../src/components/ui'

export default function SearchOverlay() {
  const [query, setQuery] = useState('')
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
      <Text variant="muted">
        Search is an overlay. It never becomes a third primary desktop or a top-bar shortcut.
      </Text>
    </View>
  )
}
