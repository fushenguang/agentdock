import { useState, type ReactNode } from 'react'
import { usePathname } from 'expo-router'
import { View } from 'react-native'
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
  const { startSession, turn } = useAgentSession()
  const domainLabel = ROUTE_DOMAINS[pathname] ?? 'TheFoolAI'

  return (
    <View className="min-h-full flex-1 bg-canvas">
      <TopBar
        domainLabel={domainLabel}
        onOpenDrawer={() => setDrawerVisible(true)}
        onNewSession={startSession}
      />
      <View className="flex-1">{children}</View>
      <AgentVoiceOrb hidden={turn.phase === 'listening' && turn.stage === 'Listening'} />
      <AppDrawer
        visible={drawerVisible}
        domainLabel={domainLabel}
        onClose={() => setDrawerVisible(false)}
      />
      <AgentBottomSheet />
    </View>
  )
}
