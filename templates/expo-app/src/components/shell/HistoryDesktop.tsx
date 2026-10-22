import { useEffect, useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { useAgentSession } from '../agent'
import { useLanguage } from '../settings/LanguageProvider'
import { tapFeedback } from '../../lib/haptics'
import { AppIcon, GlassCard, IconBadge, Section, StatusPill, Text } from '../ui'
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

  const statusTone = (status: SessionRecord['status']) =>
    status === 'active' ? 'green' : status === 'draft' ? 'amber' : 'neutral'

  return (
    <ScrollView
      testID="history-desktop"
      className="flex-1"
      contentContainerClassName="gap-6 px-5 pb-36 pt-4"
      showsVerticalScrollIndicator={false}
    >
      <GlassCard className="p-5">
        <View className="flex-row items-center gap-4">
          <IconBadge icon="history" tone="violet" size={56} />
          <View className="flex-1 gap-1">
            <Text variant="display">{t('workspace.history')}</Text>
            <Text className="text-sm leading-5 text-muted">
              {t('workspace.historyDescription')}
            </Text>
          </View>
        </View>
        <View className="mt-5 flex-row gap-3">
          <View className="flex-1 rounded-3xl bg-accentSoft px-4 py-3">
            <Text className="text-2xl font-semibold text-accentDark">
              {history.sessions.length.toString().padStart(2, '0')}
            </Text>
            <Text className="mt-1 text-xs font-medium text-muted">{t('workspace.sessions')}</Text>
          </View>
          <View className="flex-1 rounded-3xl bg-white/70 px-4 py-3">
            <AppIcon name="shield" size={26} color="#2f7d54" />
            <Text className="mt-1 text-xs font-medium text-muted">
              {t('workspace.offlineReady')}
            </Text>
          </View>
          <View className="flex-1 rounded-3xl bg-white/70 px-4 py-3">
            <Text className="text-2xl font-semibold text-ink">
              {history.sessions[0]
                ? new Date(history.sessions[0].updatedAt).toLocaleDateString(language, {
                    month: 'numeric',
                    day: 'numeric',
                  })
                : '--'}
            </Text>
            <Text className="mt-1 text-xs font-medium text-muted">{t('workspace.updated')}</Text>
          </View>
        </View>
      </GlassCard>

      <Section title={t('workspace.recent')}>
        <View className="gap-3">
          {history.state === HISTORY_LOAD_STATES.loading ? (
            <GlassCard className="p-5">
              <Text variant="muted">{t('workspace.loadingSessions')}</Text>
            </GlassCard>
          ) : null}
          {history.state === HISTORY_LOAD_STATES.failed ? (
            <GlassCard className="p-4">
              <View className="flex-row items-center gap-4">
                <IconBadge icon="info" tone="neutral" size={46} />
                <View className="flex-1 gap-1">
                  <Text variant="title">{t('workspace.historyUnavailable')}</Text>
                  <Text className="text-sm leading-5 text-muted">
                    {t('workspace.historyUnavailableBody')}
                  </Text>
                </View>
              </View>
            </GlassCard>
          ) : null}
          {history.state === HISTORY_LOAD_STATES.ready && history.sessions.length === 0 ? (
            <GlassCard className="p-4">
              <View className="flex-row items-center gap-4">
                <IconBadge icon="agent" tone="amber" size={52} />
                <View className="flex-1 gap-1">
                  <Text variant="title">{t('workspace.emptyTitle')}</Text>
                  <Text className="text-sm leading-5 text-muted">{t('workspace.emptyBody')}</Text>
                </View>
              </View>
            </GlassCard>
          ) : null}
          {history.sessions.map((session) => (
            <Pressable
              key={session.id}
              accessibilityRole="button"
              accessibilityLabel={t('drawer.continueSession', { value: session.title })}
              className="flex-row items-center gap-4 rounded-[30px] border border-white/70 bg-white/74 p-4 active:bg-white"
              onPress={() => {
                tapFeedback()
                continueSession(session.id, session.title)
              }}
            >
              <IconBadge
                icon="agent"
                tone={statusTone(session.status) as 'green' | 'amber' | 'neutral'}
                size={48}
              />
              <View className="flex-1 gap-1">
                <Text className="text-base font-semibold text-ink" numberOfLines={1}>
                  {session.title}
                </Text>
                <Text className="text-xs text-muted">
                  {new Date(session.updatedAt).toLocaleString(language)}
                </Text>
              </View>
              <StatusPill
                label={
                  session.status === 'draft'
                    ? t('status.draft')
                    : session.status === 'active'
                      ? t('status.active')
                      : t('status.archived')
                }
                tone={statusTone(session.status) as 'green' | 'amber' | 'neutral'}
              />
            </Pressable>
          ))}
        </View>
      </Section>
    </ScrollView>
  )
}
