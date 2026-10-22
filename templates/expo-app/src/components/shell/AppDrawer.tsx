import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'expo-router'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { Animated, Modal, Pressable, FlatList, Text, View, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAgentSession } from '../agent/AgentProvider'
import { useLanguage } from '../settings/LanguageProvider'
import type { SessionRecord } from '../../core/data/contracts'
import { getMobileDataStore } from '../../infra/sqlite/dataStore'
import { tapFeedback } from '../../lib/haptics'
import { AppIcon, IconBadge, Input } from '../ui'

export interface DrawerDomain {
  readonly id: string
  readonly label: string
}

export interface AppDrawerProps {
  readonly visible: boolean
  readonly domains: readonly DrawerDomain[]
  readonly selectedDomainId: string
  onSelectDomain(domainId: string): void
  onClose(): void
}

const HISTORY_LOAD_STATES = {
  loading: 'loading',
  ready: 'ready',
  failed: 'failed',
} as const

type HistoryLoadState = (typeof HISTORY_LOAD_STATES)[keyof typeof HISTORY_LOAD_STATES]

interface DrawerHistoryState {
  readonly state: HistoryLoadState
  readonly sessions: readonly SessionRecord[]
}

const DRAWER_LIST_STYLE = { flex: 1 } as const
const DRAWER_LIST_CONTENT_STYLE = { gap: 8, paddingBottom: 16 } as const

export function AppDrawer({
  visible,
  domains,
  selectedDomainId,
  onSelectDomain,
  onClose,
}: AppDrawerProps) {
  const router = useRouter()
  const { continueSession } = useAgentSession()
  const { t, language } = useLanguage()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const [domainMenuOpen, setDomainMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [history, setHistory] = useState<DrawerHistoryState>({
    state: HISTORY_LOAD_STATES.loading,
    sessions: [],
  })
  const historyRequestRef = useRef(0)
  const slide = useRef(new Animated.Value(-1)).current
  const panelWidth = Math.min(width * 0.86, 360)
  const translateX = slide.interpolate({
    inputRange: [-1, 0],
    outputRange: [-panelWidth, 0],
  })
  const selectedDomain = domains.find((domain) => domain.id === selectedDomainId) ?? {
    id: selectedDomainId,
    label: selectedDomainId,
  }

  useEffect(() => {
    if (!visible) return undefined

    let cancelled = false
    const requestId = ++historyRequestRef.current
    const query = search.trim()
    setHistory({ state: HISTORY_LOAD_STATES.loading, sessions: [] })
    const timer = setTimeout(
      () => {
        void (async () => {
          try {
            const store = await getMobileDataStore()
            const sessions = query
              ? await store.sessions.search(query, 100)
              : await store.sessions.list(100)
            if (!cancelled && historyRequestRef.current === requestId)
              setHistory({ state: HISTORY_LOAD_STATES.ready, sessions })
          } catch (error) {
            console.warn('Failed to load drawer sessions', error)
            if (!cancelled && historyRequestRef.current === requestId)
              setHistory({ state: HISTORY_LOAD_STATES.failed, sessions: [] })
          }
        })()
      },
      query ? 200 : 0,
    )

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [search, visible])

  useEffect(() => {
    if (!visible) return
    slide.setValue(-1)
    Animated.spring(slide, { toValue: 0, useNativeDriver: true, bounciness: 0, speed: 18 }).start()
  }, [slide, visible])

  const sessions = history.state === HISTORY_LOAD_STATES.ready ? history.sessions : []

  function go(route: '/user') {
    onClose()
    router.navigate(route)
  }

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View className="flex-1 flex-row bg-black/25">
        <Animated.View
          testID="navigation-drawer"
          className="h-full overflow-hidden border-r border-white/60 bg-surfaceWarm"
          style={{
            width: panelWidth,
            transform: [{ translateX }],
            paddingTop: Math.max(insets.top, 20),
            paddingBottom: Math.max(insets.bottom, 16),
          }}
        >
          <LinearGradient
            colors={['#fffaf3', '#f8f1e6', '#ffffff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.7, y: 1 }}
            style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
          />
          <BlurView
            tint="systemUltraThinMaterialLight"
            intensity={38}
            style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
          />
          <View className="gap-3 px-5">
            <Pressable
              testID="drawer-domain-selector"
              accessibilityRole="button"
              accessibilityLabel={t('drawer.selectedDomain', { value: selectedDomain.label })}
              accessibilityState={{ expanded: domainMenuOpen }}
              className="flex-row items-center gap-3 rounded-3xl border border-white/70 bg-white/72 px-3 py-3"
              onPress={() => {
                tapFeedback()
                setDomainMenuOpen((current) => !current)
              }}
            >
              <IconBadge icon="domain" tone="amber" size={40} />
              <Text className="flex-1 text-base font-semibold text-ink">
                {selectedDomain.label}
              </Text>
              <AppIcon
                name="chevronRight"
                size={16}
                color="#6b7280"
                weight={domainMenuOpen ? 'semibold' : 'regular'}
              />
            </Pressable>
            {domainMenuOpen ? (
              <View className="overflow-hidden rounded-2xl bg-canvas">
                {domains.map((domain) => (
                  <Pressable
                    key={domain.id}
                    accessibilityRole="button"
                    accessibilityLabel={t('drawer.switchDomain', { value: domain.label })}
                    accessibilityState={{ selected: domain.id === selectedDomain.id }}
                    className="px-4 py-3 active:bg-line"
                    onPress={() => {
                      onSelectDomain(domain.id)
                      setDomainMenuOpen(false)
                    }}
                  >
                    <Text className="text-base text-ink">{domain.label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <View className="h-14 flex-row items-center gap-2 rounded-3xl border border-white/70 bg-white/72 px-2">
              <View className="h-11 w-11 items-center justify-center rounded-full bg-accentSoft">
                <AppIcon name="search" size={15} color="#b8731f" />
              </View>
              <Input
                testID="drawer-session-search"
                className="min-h-12 flex-1 border-0 bg-transparent pl-0"
                placeholder={t('drawer.searchPlaceholder')}
                value={search}
                onChangeText={setSearch}
                returnKeyType="search"
              />
            </View>
          </View>

          <View testID="drawer-session-list" className="flex-1 gap-2 px-5 pt-4">
            <FlatList
              style={DRAWER_LIST_STYLE}
              contentContainerStyle={DRAWER_LIST_CONTENT_STYLE}
              data={sessions}
              keyExtractor={(session) => session.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item: session }) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('drawer.continueSession', { value: session.title })}
                  className="flex-row items-center gap-3 rounded-3xl border border-white/70 bg-white/76 px-3 py-3 active:bg-white"
                  onPress={() => {
                    tapFeedback()
                    onClose()
                    continueSession(session.id, session.title)
                  }}
                >
                  <View className="h-9 w-9 items-center justify-center rounded-full bg-accentSoft">
                    <AppIcon name="agent" size={17} color="#b8731f" />
                  </View>
                  <View className="flex-1 gap-1">
                    <Text className="text-sm font-semibold text-ink" numberOfLines={1}>
                      {session.title}
                    </Text>
                    <Text className="text-xs text-muted">
                      {new Date(session.updatedAt).toLocaleString(language)}
                    </Text>
                  </View>
                </Pressable>
              )}
              ListEmptyComponent={
                <>
                  {history.state === HISTORY_LOAD_STATES.loading ? (
                    <Text className="px-1 py-3 text-sm text-muted">{t('drawer.loading')}</Text>
                  ) : null}
                  {history.state === HISTORY_LOAD_STATES.failed ? (
                    <Text className="px-1 py-3 text-sm text-danger">{t('drawer.unavailable')}</Text>
                  ) : null}
                  {history.state === HISTORY_LOAD_STATES.ready ? (
                    <Text className="px-1 py-3 text-sm text-muted">{t('drawer.noMatching')}</Text>
                  ) : null}
                </>
              }
            />
          </View>

          <View className="border-t border-line px-5 pt-3">
            <Pressable
              testID="drawer-user-entry"
              accessibilityRole="button"
              accessibilityLabel={t('drawer.openUser')}
              className="flex-row items-center gap-3 rounded-3xl px-1 py-2 active:opacity-70"
              onPress={() => {
                tapFeedback()
                go('/user')
              }}
            >
              <IconBadge icon="user" tone="violet" size={42} />
              <View className="flex-1">
                <Text className="text-base font-medium text-ink">{t('drawer.user')}</Text>
                <Text className="text-xs text-muted">{t('drawer.userDetail')}</Text>
              </View>
            </Pressable>
          </View>
        </Animated.View>
        <Pressable accessibilityLabel={t('drawer.close')} className="flex-1" onPress={onClose} />
      </View>
    </Modal>
  )
}
