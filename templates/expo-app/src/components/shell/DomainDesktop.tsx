import { useRouter } from 'expo-router'
import { ScrollView, View } from 'react-native'
import { tapFeedback } from '../../lib/haptics'
import { useAgentSession } from '../agent'
import { useLanguage } from '../settings/LanguageProvider'
import { ActionTile, Button, GlassCard, IconBadge, Section, StatusPill, Text } from '../ui'

const capabilities = [
  {
    key: 'localFirst',
    icon: 'layers',
    tone: 'amber',
    titleKey: 'workspace.localFirstTitle',
    bodyKey: 'workspace.localFirstBody',
  },
  {
    key: 'privateTools',
    icon: 'shield',
    tone: 'green',
    titleKey: 'workspace.privateToolsTitle',
    bodyKey: 'workspace.privateToolsBody',
  },
  {
    key: 'verifiedOutput',
    icon: 'metrics',
    tone: 'sky',
    titleKey: 'workspace.verifiedOutputTitle',
    bodyKey: 'workspace.verifiedOutputBody',
  },
] as const

export function DomainDesktop() {
  const { startSession } = useAgentSession()
  const { t } = useLanguage()
  const router = useRouter()

  return (
    <ScrollView
      testID="domain-desktop"
      className="flex-1"
      contentContainerClassName="gap-4 px-5 pb-24 pt-4"
      showsVerticalScrollIndicator={false}
    >
      <GlassCard className="p-4">
        <View className="relative gap-4">
          <View className="flex-row items-center gap-4">
            <IconBadge icon="spark" tone="amber" size={48} />
            <View className="flex-1 flex-row items-center justify-between gap-3">
              <Text variant="display">{t('workspace.domain')}</Text>
              <StatusPill label={t('workspace.heroReady')} tone="green" />
            </View>
          </View>
          <Text className="text-base leading-6 text-inkSoft">{t('workspace.heroBody')}</Text>
          <View className="flex-row items-center justify-between gap-3">
            <Button
              testID="domain-desktop-new-session"
              accessibilityLabel={t('workspace.startVoiceSession')}
              label={t('workspace.heroCta')}
              onPress={() => {
                tapFeedback()
                startSession()
              }}
            />
            <Text className="max-w-[52%] text-right text-xs leading-4 text-muted">
              {t('workspace.startVoiceSessionBody')}
            </Text>
          </View>
        </View>
      </GlassCard>

      <Section title={t('workspace.quickActions')}>
        <View className="flex-row flex-wrap gap-3">
          <ActionTile
            icon="mic"
            tone="amber"
            title={t('workspace.voiceQuickTitle')}
            detail={t('workspace.voiceQuickDetail')}
            className="min-w-[46%] flex-grow"
            onPress={() => {
              tapFeedback()
              startSession()
            }}
          />
          <ActionTile
            icon="history"
            tone="violet"
            title={t('workspace.historyQuickTitle')}
            detail={t('workspace.historyQuickDetail')}
            className="min-w-[46%] flex-grow"
            onPress={() => {
              tapFeedback()
              router.replace('/history')
            }}
          />
          <ActionTile
            icon="search"
            tone="sky"
            title={t('workspace.searchQuickTitle')}
            detail={t('workspace.searchQuickDetail')}
            className="min-w-[46%] flex-grow"
            onPress={() => {
              tapFeedback()
              router.push('/search')
            }}
          />
          <ActionTile
            icon="shield"
            tone="green"
            title={t('user.privacy')}
            detail={t('user.privacyBody')}
            className="min-w-[46%] flex-grow"
            onPress={() => {
              tapFeedback()
              router.navigate('/user/privacy')
            }}
          />
        </View>
      </Section>

      <Section title={t('workspace.capabilities')}>
        <GlassCard className="p-1.5">
          {capabilities.map((capability, index) => (
            <View
              key={capability.key}
              className={
                index === 0
                  ? 'flex-row items-center gap-3 px-3 py-2.5'
                  : 'flex-row items-center gap-3 border-t border-lineWarm px-3 py-2.5'
              }
            >
              <IconBadge icon={capability.icon} tone={capability.tone} size={38} />
              <View className="flex-1 gap-1">
                <Text className="text-sm font-semibold text-ink" numberOfLines={1}>
                  {t(capability.titleKey)}
                </Text>
                <Text className="text-xs leading-4 text-muted">{t(capability.bodyKey)}</Text>
              </View>
            </View>
          ))}
        </GlassCard>
      </Section>
    </ScrollView>
  )
}
