import { useEffect, useRef, useState, type ReactNode } from 'react'
import { usePathname, useRouter } from 'expo-router'
import { Menu, Plus } from 'lucide-react-native'
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AgentBottomSheet, AgentVoiceOrb } from '../agent'
import { useAgentSession } from '../agent/AgentProvider'
import { useLanguage } from '../settings/LanguageProvider'
import { AppDrawer } from './AppDrawer'
import { DomainDesktop } from './DomainDesktop'
import { HistoryDesktop } from './HistoryDesktop'

const WORKSPACES = [{ route: '/' }, { route: '/history' }] as const

const DOMAIN_OPTIONS = [{ id: 'thefoolai' }] as const

function workspaceIndex(pathname: string): number {
  return WORKSPACES.findIndex((workspace) => workspace.route === pathname)
}

function WorkspacePager({
  initialIndex,
  onWorkspaceChange,
  onOpenDrawer,
  onNewSession,
}: {
  initialIndex: number
  onWorkspaceChange(index: number): void
  onOpenDrawer(): void
  onNewSession(): void
}) {
  const { t } = useLanguage()
  const { width } = useWindowDimensions()
  const scrollRef = useRef<ScrollView>(null)
  const [index, setIndex] = useState(initialIndex)

  useEffect(() => {
    setIndex(initialIndex)
    scrollRef.current?.scrollTo({ x: initialIndex * width, animated: false })
  }, [initialIndex, width])

  function selectWorkspace(nextIndex: number) {
    if (nextIndex === index) return
    setIndex(nextIndex)
    scrollRef.current?.scrollTo({ x: nextIndex * width, animated: true })
    onWorkspaceChange(nextIndex)
  }

  return (
    <View testID="workspace-pager" className="flex-1">
      <View
        testID="workspace-dock"
        className="absolute left-0 right-0 top-0 z-10 bg-canvas px-5 pb-2 pt-1"
      >
        <View className="flex-row items-center">
          <Pressable
            testID="topbar-drawer"
            accessibilityRole="button"
            accessibilityLabel={t('topbar.openNavigation')}
            className="h-10 w-10 items-center justify-center rounded-full bg-canvas"
            onPress={onOpenDrawer}
          >
            <Menu size={18} color="#17211d" />
          </Pressable>
          <View
            testID="workspace-page-indicator"
            className="flex-1 flex-row items-center justify-center gap-2 px-1"
          >
            {WORKSPACES.map((workspace, indicatorIndex) => (
              <Pressable
                key={workspace.route}
                accessibilityRole="button"
                accessibilityLabel={
                  indicatorIndex === 0 ? t('workspace.switchDomain') : t('workspace.switchHistory')
                }
                accessibilityState={{ selected: indicatorIndex === index }}
                className={`h-2 rounded-full ${
                  indicatorIndex === index ? 'w-8 bg-accent' : 'w-3 bg-line'
                }`}
                onPress={() => selectWorkspace(indicatorIndex)}
              />
            ))}
          </View>
          <Pressable
            testID="topbar-new-session"
            accessibilityRole="button"
            accessibilityLabel={t('topbar.newSession')}
            className="h-10 w-10 items-center justify-center rounded-full bg-accent"
            onPress={onNewSession}
          >
            <Plus size={20} color="#ffffff" />
          </Pressable>
        </View>
      </View>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 76 }}
        ref={scrollRef}
        horizontal
        pagingEnabled
        directionalLockEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const nextIndex = Math.round(
            event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width,
          )
          if (nextIndex !== index) {
            setIndex(nextIndex)
            onWorkspaceChange(nextIndex)
          }
        }}
      >
        <View style={{ width }}>
          <DomainDesktop />
        </View>
        <View style={{ width }}>
          <HistoryDesktop />
        </View>
      </ScrollView>
    </View>
  )
}

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const [drawerVisible, setDrawerVisible] = useState(false)
  const { t } = useLanguage()
  const [selectedDomainId, setSelectedDomainId] = useState<string>(DOMAIN_OPTIONS[0].id)
  const pathname = usePathname()
  const router = useRouter()
  const { startSession, sheetOpen, closeAgent, setDomainId } = useAgentSession()
  const domainOptions = DOMAIN_OPTIONS.map((domain) => ({
    ...domain,
    label: domain.id === 'thefoolai' ? t('workspace.domain') : domain.id,
  }))
  const activeDomain = domainOptions.find((domain) => domain.id === selectedDomainId) ?? {
    id: selectedDomainId,
    label: selectedDomainId,
  }
  const activeWorkspaceIndex = workspaceIndex(pathname)
  const insets = useSafeAreaInsets()

  return (
    <View className="min-h-full flex-1 bg-canvas" style={{ paddingTop: Math.max(insets.top, 12) }}>
      <View className="flex-1">
        {activeWorkspaceIndex >= 0 ? (
          <WorkspacePager
            initialIndex={activeWorkspaceIndex}
            onWorkspaceChange={(index) => router.replace(WORKSPACES[index]?.route ?? '/')}
            onOpenDrawer={() => {
              if (sheetOpen) closeAgent()
              setDrawerVisible(true)
            }}
            onNewSession={startSession}
          />
        ) : (
          children
        )}
      </View>
      <AgentVoiceOrb hidden={sheetOpen} />
      <AppDrawer
        visible={drawerVisible}
        domains={domainOptions}
        selectedDomainId={activeDomain.id}
        onSelectDomain={(domainId) => {
          setSelectedDomainId(domainId)
          setDomainId(domainId)
        }}
        onClose={() => setDrawerVisible(false)}
      />
      <AgentBottomSheet />
    </View>
  )
}
