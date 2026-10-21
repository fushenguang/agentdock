import { Menu, Plus } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'

export interface TopBarProps {
  domainLabel: string
  onOpenDrawer(): void
  onNewSession(): void
}

export function TopBar({ domainLabel, onOpenDrawer, onNewSession }: TopBarProps) {
  return (
    <View className="flex-row items-center justify-between px-5 pb-4 pt-3">
      <Pressable
        testID="topbar-drawer"
        accessibilityLabel={`Open navigation for ${domainLabel}`}
        className="h-11 flex-row items-center gap-2 rounded-full bg-surface px-4"
        onPress={onOpenDrawer}
      >
        <Menu size={18} color="#17211d" />
        <Text className="max-w-40 text-sm font-medium text-ink" numberOfLines={1}>
          {domainLabel}
        </Text>
      </Pressable>
      <Pressable
        testID="topbar-new-session"
        accessibilityLabel="New session"
        className="h-11 w-11 items-center justify-center rounded-full bg-accent"
        onPress={onNewSession}
      >
        <Plus size={20} color="#ffffff" />
      </Pressable>
    </View>
  )
}
