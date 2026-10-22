import { useRouter } from 'expo-router'
import { ScrollView, View } from 'react-native'
import { tapFeedback } from '../../lib/haptics'
import { useAgentSession } from '../agent'
import { useLanguage } from '../settings/LanguageProvider'
import {
  ActionTile,
  Button,
  DetailCard,
  GlassCard,
  IconBadge,
  Section,
  StatusPill,
  Text,
} from '../ui'

export function DomainDesktop() {
  const { startSession } = useAgentSession()
  const { t } = useLanguage()
  const router = useRouter()

  return (
    <ScrollView
      testID="domain-desktop"
      className="flex-1"
      contentContainerClassName="gap-6 px-5 pb-36 pt-4"
      showsVerticalScrollIndicator={false}
    >
      <GlassCard className="p-5">
        <View className="relative gap-5">
          <View className="flex-row items-center gap-4">
            <IconBadge icon="spark" tone="amber" size={54} />
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
              router.navigate('/history')
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
              router.navigate('/search')
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
        <View className="gap-3">
          <DetailCard
            icon="layers"
            tone="amber"
            title={t('workspace.localFirstTitle')}
            body={t('workspace.localFirstBody')}
          />
          <DetailCard
            icon="shield"
            tone="green"
            title={t('workspace.privateToolsTitle')}
            body={t('workspace.privateToolsBody')}
          />
          <DetailCard
            icon="metrics"
            tone="sky"
            title={t('workspace.verifiedOutputTitle')}
            body={t('workspace.verifiedOutputBody')}
          />
        </View>
      </Section>
    </ScrollView>
  )
}
