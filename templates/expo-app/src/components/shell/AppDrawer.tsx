import { useRouter } from 'expo-router'
import { Clock, Search, User } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { Modal, Pressable, Text, View } from 'react-native'
import { useAgentSession } from '../agent/AgentProvider'

export interface AppDrawerProps {
  visible: boolean
  domainLabel: string
  onClose(): void
}

function DrawerRow({
  icon,
  label,
  detail,
  onPress,
}: {
  icon: ReactNode
  label: string
  detail: string
  onPress?: () => void
}) {
  return (
    <Pressable
      className="flex-row items-center gap-4 rounded-2xl px-3 py-4 active:bg-canvas"
      onPress={onPress}
    >
      <View className="text-accent">{icon}</View>
      <View className="flex-1">
        <Text className="text-base font-medium text-ink">{label}</Text>
        <Text className="text-xs text-muted">{detail}</Text>
      </View>
    </Pressable>
  )
}

export function AppDrawer({ visible, domainLabel, onClose }: AppDrawerProps) {
  const router = useRouter()
  const { openAgent } = useAgentSession()

  function go(route: '/' | '/history' | '/search' | '/user') {
    onClose()
    router.navigate(route)
  }

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/25">
        <View testID="navigation-drawer" className="gap-2 rounded-t-3xl bg-surface p-5 pb-10">
          <Text className="pb-2 text-xs text-muted">Current domain</Text>
          <DrawerRow
            icon={<View className="h-5 w-5 rounded-md bg-accent/20" />}
            label={domainLabel}
            detail="Domain Desktop"
            onPress={() => go('/')}
          />
          <DrawerRow
            icon={<Search size={20} color="#4f7c5b" />}
            label="Search"
            detail="Find sessions, tasks, and domain objects"
            onPress={() => go('/search')}
          />
          <DrawerRow
            icon={<Clock size={20} color="#4f7c5b" />}
            label="History & Tasks"
            detail="Continue earlier work"
            onPress={() => go('/history')}
          />
          <DrawerRow
            icon={<User size={20} color="#4f7c5b" />}
            label="User"
            detail="Profile, privacy, storage, and sync"
            onPress={() => go('/user')}
          />
          <Pressable
            className="mt-3 rounded-full bg-accent px-5 py-3"
            onPress={() => {
              onClose()
              openAgent()
            }}
          >
            <Text className="text-center text-base font-medium text-white">
              Continue with agent
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}
