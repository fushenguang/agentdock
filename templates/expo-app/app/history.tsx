import { useCallback, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import { Pressable, ScrollView, View } from 'react-native'
import { useAgentSession } from '../src/components/agent'
import { Card, Section, Text } from '../src/components/ui'
import type { SessionRecord } from '../src/core/data/contracts'
import { getMobileDataStore } from '../src/infra/sqlite/dataStore'

const HISTORY_LOAD_STATES = {
  loading: 'loading',
  ready: 'ready',
  failed: 'failed',
} as const

type HistoryLoadState = (typeof HISTORY_LOAD_STATES)[keyof typeof HISTORY_LOAD_STATES]

const SESSION_STATUS_LABELS: Record<SessionRecord['status'], string> = {
  draft: 'Draft',
  active: 'Active',
  archived: 'Archived',
}

interface HistoryState {
  readonly state: HistoryLoadState
  readonly sessions: readonly SessionRecord[]
}

export default function HistoryDesktop() {
  const { continueSession } = useAgentSession()
  const [history, setHistory] = useState<HistoryState>({
    state: HISTORY_LOAD_STATES.loading,
    sessions: [],
  })

  useFocusEffect(
    useCallback(() => {
      let cancelled = false
      const loadSessions = async () => {
        try {
          const sessions = await getMobileDataStore().sessions.list(20)
          if (!cancelled) setHistory({ state: HISTORY_LOAD_STATES.ready, sessions })
        } catch (error) {
          console.warn('Failed to load local sessions', error)
          if (!cancelled) setHistory({ state: HISTORY_LOAD_STATES.failed, sessions: [] })
        }
      }

      void loadSessions()

      return () => {
        cancelled = true
      }
    }, []),
  )

  return (
    <ScrollView
      testID="history-desktop"
      className="flex-1"
      contentContainerClassName="gap-8 px-5 pb-32"
    >
      <View className="gap-3 pt-4">
        <Text variant="display">History & Tasks</Text>
        <Text variant="muted">Continue local sessions even when the network is unavailable.</Text>
      </View>
      <Section title="Recent">
        <View className="gap-4">
          {history.state === HISTORY_LOAD_STATES.loading ? (
            <Card>
              <Text variant="muted">Loading local sessions…</Text>
            </Card>
          ) : null}
          {history.state === HISTORY_LOAD_STATES.failed ? (
            <Card>
              <Text variant="title">Local history is unavailable</Text>
              <Text className="mt-2">Restart the app or check local storage permissions.</Text>
            </Card>
          ) : null}
          {history.state === HISTORY_LOAD_STATES.ready && history.sessions.length === 0 ? (
            <Card>
              <Text variant="title">No sessions yet</Text>
              <Text className="mt-2">Start a voice session to create local history.</Text>
            </Card>
          ) : null}
          {history.sessions.map((session) => (
            <Pressable
              key={session.id}
              accessibilityRole="button"
              accessibilityLabel={`Continue session ${session.title}`}
              accessibilityHint="Opens this session in the agent panel"
              onPress={() => continueSession(session.id, session.title)}
            >
              <Card>
                <Text variant="title">{session.title}</Text>
                <Text className="mt-2">
                  {SESSION_STATUS_LABELS[session.status]} ·{' '}
                  {new Date(session.updatedAt).toLocaleString()}
                </Text>
              </Card>
            </Pressable>
          ))}
        </View>
      </Section>
    </ScrollView>
  )
}
