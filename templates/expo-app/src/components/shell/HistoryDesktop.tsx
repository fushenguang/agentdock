import { useEffect, useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { useAgentSession } from '../agent'
import { useLanguage } from '../settings/LanguageProvider'
import { Card, Section, Text } from '../ui'
import type { SessionRecord } from '../../core/data/contracts'
import { getMobileDataStore } from '../../infra/sqlite/dataStore'

const HISTORY_LOAD_STATES = {
  loading: 'loading',
  ready: 'ready',
  failed: 'failed',
} as const

type HistoryLoadState = (typeof HISTORY_LOAD_STATES)[keyof typeof HISTORY_LOAD_STATES]

interface HistoryState {
  readonly state: HistoryLoadState
  readonly sessions: readonly SessionRecord[]
}

export function HistoryDesktop() {
  const { continueSession, turn } = useAgentSession()
  const { t, language } = useLanguage()
  const [history, setHistory] = useState<HistoryState>({
    state: HISTORY_LOAD_STATES.loading,
    sessions: [],
  })

  useEffect(() => {
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
  }, [turn.updatedAt])

  return (
    <ScrollView
      testID="history-desktop"
      className="flex-1"
      contentContainerClassName="gap-8 px-5 pb-32"
    >
      <View className="gap-3 pt-4">
        <Text variant="display">{t('workspace.history')}</Text>
        <Text variant="muted">{t('workspace.historyDescription')}</Text>
      </View>
      <Section title={t('workspace.recent')}>
        <View className="gap-4">
          {history.state === HISTORY_LOAD_STATES.loading ? (
            <Card>
              <Text variant="muted">{t('workspace.loadingSessions')}</Text>
            </Card>
          ) : null}
          {history.state === HISTORY_LOAD_STATES.failed ? (
            <Card>
              <Text variant="title">{t('workspace.historyUnavailable')}</Text>
              <Text className="mt-2">{t('workspace.historyUnavailableBody')}</Text>
            </Card>
          ) : null}
          {history.state === HISTORY_LOAD_STATES.ready && history.sessions.length === 0 ? (
            <Card>
              <Text variant="title">{t('workspace.noSessions')}</Text>
              <Text className="mt-2">{t('workspace.noSessionsBody')}</Text>
            </Card>
          ) : null}
          {history.sessions.map((session) => (
            <Pressable
              key={session.id}
              accessibilityRole="button"
              accessibilityLabel={t('drawer.continueSession', { value: session.title })}
              accessibilityHint="Opens this session in the agent panel"
              onPress={() => continueSession(session.id, session.title)}
            >
              <Card>
                <Text variant="title">{session.title}</Text>
                <Text className="mt-2">
                  {session.status === 'draft'
                    ? t('status.draft')
                    : session.status === 'active'
                      ? t('status.active')
                      : t('status.archived')}{' '}
                  · {new Date(session.updatedAt).toLocaleString(language)}
                </Text>
              </Card>
            </Pressable>
          ))}
        </View>
      </Section>
    </ScrollView>
  )
}
