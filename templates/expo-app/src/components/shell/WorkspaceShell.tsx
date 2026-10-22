import { useEffect, useRef, useState, type ReactNode } from 'react'
import { usePathname, useRouter } from 'expo-router'
import { BlurView } from 'expo-blur'
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AgentBottomSheet, AgentVoiceOrb } from '../agent'
import { useAgentSession } from '../agent/AgentProvider'
import { useLanguage } from '../settings/LanguageProvider'
import { AppDrawer } from './AppDrawer'
import { DomainDesktop } from './DomainDesktop'
import { HistoryDesktop } from './HistoryDesktop'
import { tapFeedback } from '../../lib/haptics'
import { AppIcon, BrandBackdrop } from '../ui'

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
        className="absolute left-0 right-0 top-0 z-10 overflow-hidden px-5 pb-2 pt-2"
      >
        <BlurView
          tint="systemChromeMaterialLight"
          intensity={72}
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
        />
        <View className="flex-row items-center">
          <Pressable
            testID="topbar-drawer"
            accessibilityRole="button"
            accessibilityLabel={t('topbar.openNavigation')}
            className="h-12 w-12 items-center justify-center rounded-full border border-white/70 bg-white/60"
            onPress={() => {
              tapFeedback()
              onOpenDrawer()
            }}
          >
            <AppIcon name="menu" size={20} color="#1a1d23" />
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
                className={`h-2.5 rounded-full ${
                  indicatorIndex === index ? 'w-9 bg-accent' : 'w-3 bg-muted/40'
                }`}
                onPress={() => {
                  tapFeedback()
                  selectWorkspace(indicatorIndex)
                }}
              />
            ))}
          </View>
          <Pressable
            testID="topbar-new-session"
            accessibilityRole="button"
            accessibilityLabel={t('topbar.newSession')}
            className="h-12 w-12 items-center justify-center rounded-full bg-accent"
            onPress={() => {
              tapFeedback()
              onNewSession()
            }}
          >
            <AppIcon name="plus" size={21} color="#ffffff" />
          </Pressable>
        </View>
      </View>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 84 }}
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
    <View
      className="relative min-h-full flex-1 bg-canvas"
      style={{ paddingTop: Math.max(insets.top, 12) }}
    >
      <BrandBackdrop />
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
