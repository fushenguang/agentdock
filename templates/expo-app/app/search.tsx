import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'expo-router'
import { Pressable, ScrollView, View } from 'react-native'
import { useAgentSession } from '../src/components/agent'
import { useLanguage } from '../src/components/settings/LanguageProvider'
import {
  AppIcon,
  GlassCard,
  IconBadge,
  Input,
  Section,
  StatusPill,
  Text,
} from '../src/components/ui'
import { tapFeedback } from '../src/lib/haptics'
import type { SessionRecord } from '../src/core/data/contracts'
import { getMobileDataStore } from '../src/infra/sqlite/dataStore'

export default function SearchOverlay() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<readonly SessionRecord[]>([])
  const [searching, setSearching] = useState(false)
  const [searchFailed, setSearchFailed] = useState(false)
  const searchRequestRef = useRef(0)
  const router = useRouter()
  const { continueSession } = useAgentSession()
  const { t, language } = useLanguage()

  useEffect(() => {
    let cancelled = false
    const normalizedQuery = query.trim()
    if (normalizedQuery.length === 0) {
      searchRequestRef.current += 1
      setResults([])
      setSearching(false)
      setSearchFailed(false)
      return () => {
        cancelled = true
      }
    }

    const requestId = ++searchRequestRef.current
    setResults([])
    setSearching(true)
    setSearchFailed(false)
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const store = await getMobileDataStore()
          const values = await store.sessions.search(normalizedQuery, 50)
          if (!cancelled && searchRequestRef.current === requestId) {
            setResults(values)
            setSearchFailed(false)
          }
        } catch (error: unknown) {
          console.warn('Search failed to load sessions', error)
          if (!cancelled && searchRequestRef.current === requestId) {
            setResults([])
            setSearchFailed(true)
          }
        } finally {
          if (!cancelled && searchRequestRef.current === requestId) setSearching(false)
        }
      })()
    }, 200)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query])

  const normalizedQuery = query.trim()

  const suggestions = [
    t('search.suggestionToday'),
    t('search.suggestionTasks'),
    t('search.suggestionDomain'),
  ]

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="gap-5 px-5 pb-36 pt-4"
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-row items-center justify-between">
        <Text variant="display">{t('search.title')}</Text>
        <Pressable
          testID="search-close"
          accessibilityRole="button"
          accessibilityLabel={t('search.close')}
          className="h-12 w-12 items-center justify-center rounded-full border border-white/70 bg-white/70"
          onPress={() => {
            tapFeedback()
            router.dismissTo('/')
          }}
        >
          <AppIcon name="close" size={18} color="#bd4535" />
        </Pressable>
      </View>

      <GlassCard className="p-4">
        <View className="flex-row items-center gap-3">
          <IconBadge icon="search" tone="sky" size={44} />
          <Input
            testID="search-input"
            autoFocus
            className="flex-1"
            value={query}
            onChangeText={setQuery}
            placeholder={t('search.placeholder')}
            returnKeyType="search"
          />
        </View>
      </GlassCard>

      <Section title={t('search.suggestions')}>
        <View className="flex-row flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <Pressable
              key={suggestion}
              className="rounded-full bg-accentSoft px-4 py-2 active:bg-lineWarm"
              onPress={() => {
                tapFeedback()
                setQuery(suggestion)
              }}
            >
              <Text className="text-sm font-medium text-accentDark">{suggestion}</Text>
            </Pressable>
          ))}
        </View>
      </Section>

      {normalizedQuery ? (
        <Section title={`${t('workspace.sessions')} · ${results.length}`}>
          <View className="gap-3">
            {searching && results.length === 0 ? (
              <GlassCard className="p-5">
                <Text variant="muted">{t('search.loading')}</Text>
              </GlassCard>
            ) : null}
            {!searching && searchFailed ? (
              <GlassCard className="p-5">
                <Text variant="muted">{t('search.unavailable')}</Text>
              </GlassCard>
            ) : null}
            {!searching && !searchFailed && results.length === 0 ? (
              <GlassCard className="p-5">
                <Text variant="muted">{t('drawer.noMatching')}</Text>
              </GlassCard>
            ) : null}
            {results.map((session) => (
              <Pressable
                key={session.id}
                className="flex-row items-center gap-3 rounded-[28px] border border-white/70 bg-white/76 p-4 active:bg-white"
                onPress={() => {
                  tapFeedback()
                  continueSession(session.id, session.title)
                  router.dismissTo('/')
                }}
              >
                <IconBadge icon="agent" tone="amber" size={40} />
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
                  tone="neutral"
                />
              </Pressable>
            ))}
          </View>
        </Section>
      ) : null}

      <Text variant="muted">{t('search.description')}</Text>
    </ScrollView>
  )
}
