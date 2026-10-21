import { useState, type ReactNode } from 'react'
import { usePathname } from 'expo-router'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AgentBottomSheet, AgentVoiceOrb } from '../agent'
import { useAgentSession } from '../agent/AgentProvider'
import { AppDrawer } from './AppDrawer'
import { TopBar } from './TopBar'

const ROUTE_DOMAINS: Record<string, string> = {
  '/': 'TheFoolAI',
  '/history': 'History & Tasks',
}

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const [drawerVisible, setDrawerVisible] = useState(false)
  const pathname = usePathname()
  const { startSession, sheetOpen } = useAgentSession()
  const domainLabel = ROUTE_DOMAINS[pathname] ?? 'TheFoolAI'
  const insets = useSafeAreaInsets()

  return (
    <View className="min-h-full flex-1 bg-canvas" style={{ paddingTop: Math.max(insets.top, 12) }}>
      <TopBar
        domainLabel={domainLabel}
        onOpenDrawer={() => setDrawerVisible(true)}
        onNewSession={startSession}
      />
      <View className="flex-1">{children}</View>
      <AgentVoiceOrb hidden={sheetOpen} />
      <AppDrawer
        visible={drawerVisible}
        domainLabel={domainLabel}
        onClose={() => setDrawerVisible(false)}
      />
      <AgentBottomSheet />
    </View>
  )
}
