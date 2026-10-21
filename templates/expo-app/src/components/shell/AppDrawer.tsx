import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'expo-router'
import { ChevronDown, Search, User } from 'lucide-react-native'
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAgentSession } from '../agent/AgentProvider'
import type { SessionRecord } from '../../core/data/contracts'
import { getMobileDataStore } from '../../infra/sqlite/dataStore'
import { Input } from '../ui'

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

export function AppDrawer({
  visible,
  domains,
  selectedDomainId,
  onSelectDomain,
  onClose,
}: AppDrawerProps) {
  const router = useRouter()
  const { continueSession } = useAgentSession()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const [domainMenuOpen, setDomainMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [history, setHistory] = useState<DrawerHistoryState>({
    state: HISTORY_LOAD_STATES.loading,
    sessions: [],
  })
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
    const loadSessions = async () => {
      try {
        const sessions = await getMobileDataStore().sessions.list(100)
        if (!cancelled) setHistory({ state: HISTORY_LOAD_STATES.ready, sessions })
      } catch (error) {
        console.warn('Failed to load drawer sessions', error)
        if (!cancelled) setHistory({ state: HISTORY_LOAD_STATES.failed, sessions: [] })
      }
    }

    void loadSessions()
    slide.setValue(-1)
    Animated.spring(slide, { toValue: 0, useNativeDriver: true, bounciness: 0, speed: 18 }).start()

    return () => {
      cancelled = true
    }
  }, [slide, visible])

  const sessions = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (history.state !== HISTORY_LOAD_STATES.ready) return []
    if (query.length === 0) return history.sessions
    return history.sessions.filter(
      (session) =>
        session.title.toLowerCase().includes(query) ||
        session.domainId.toLowerCase().includes(query),
    )
  }, [history, search])

  function go(route: '/user') {
    onClose()
    router.navigate(route)
  }

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View className="flex-1 flex-row bg-black/25">
        <Pressable
          accessibilityLabel="Close navigation drawer"
          className="flex-1"
          onPress={onClose}
        />
        <Animated.View
          testID="navigation-drawer"
          className="h-full bg-surface"
          style={{
            width: panelWidth,
            transform: [{ translateX }],
            paddingTop: Math.max(insets.top, 20),
            paddingBottom: Math.max(insets.bottom, 16),
          }}
        >
          <View className="gap-3 px-5">
            <Text className="text-xs uppercase text-muted">Domain</Text>
            <Pressable
              testID="drawer-domain-selector"
              accessibilityRole="button"
              accessibilityLabel={`Selected domain ${selectedDomain.label}`}
              accessibilityState={{ expanded: domainMenuOpen }}
              className="flex-row items-center justify-between rounded-2xl bg-canvas px-4 py-3"
              onPress={() => setDomainMenuOpen((current) => !current)}
            >
              <Text className="text-base font-medium text-ink">{selectedDomain.label}</Text>
              <ChevronDown size={18} color="#17211d" />
            </Pressable>
            {domainMenuOpen ? (
              <View className="overflow-hidden rounded-2xl bg-canvas">
                {domains.map((domain) => (
                  <Pressable
                    key={domain.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Switch to ${domain.label}`}
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
            <View className="relative">
              <Search
                size={16}
                color="#69746f"
                style={{ position: 'absolute', left: 14, top: 17, zIndex: 1 }}
              />
              <Input
                testID="drawer-session-search"
                className="pl-10"
                placeholder="Search session history"
                value={search}
                onChangeText={setSearch}
                returnKeyType="search"
              />
            </View>
          </View>

          <View testID="drawer-session-list" className="flex-1 gap-2 px-5 pt-5">
            <Text className="text-xs uppercase text-muted">Sessions</Text>
            <ScrollView className="flex-1" contentContainerClassName="gap-2 pb-4">
              {history.state === HISTORY_LOAD_STATES.loading ? (
                <Text className="px-1 py-3 text-sm text-muted">Loading sessions…</Text>
              ) : null}
              {history.state === HISTORY_LOAD_STATES.failed ? (
                <Text className="px-1 py-3 text-sm text-danger">
                  Session history is unavailable. Restart the app and try again.
                </Text>
              ) : null}
              {history.state === HISTORY_LOAD_STATES.ready && sessions.length === 0 ? (
                <Text className="px-1 py-3 text-sm text-muted">No matching sessions.</Text>
              ) : null}
              {sessions.map((session) => (
                <Pressable
                  key={session.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Continue session ${session.title}`}
                  className="rounded-2xl bg-canvas px-4 py-3 active:bg-line"
                  onPress={() => {
                    onClose()
                    continueSession(session.id, session.title)
                  }}
                >
                  <Text className="text-sm font-medium text-ink" numberOfLines={1}>
                    {session.title}
                  </Text>
                  <Text className="mt-1 text-xs text-muted">
                    {new Date(session.updatedAt).toLocaleString()}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View className="border-t border-line px-5 pt-3">
            <Pressable
              testID="drawer-user-entry"
              accessibilityRole="button"
              accessibilityLabel="Open user information"
              className="flex-row items-center gap-3 rounded-2xl px-1 py-2 active:bg-canvas"
              onPress={() => go('/user')}
            >
              <User size={20} color="#4f7c5b" />
              <View className="flex-1">
                <Text className="text-base font-medium text-ink">User</Text>
                <Text className="text-xs text-muted">Profile, privacy, storage, and sync</Text>
              </View>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  )
}
