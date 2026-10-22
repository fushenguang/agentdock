import { LinearGradient } from 'expo-linear-gradient'
import { Image } from 'expo-image'
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
        <Image
          source={require('../../../assets/brand-hero.png')}
          contentFit="cover"
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
        />
        <LinearGradient
          colors={['rgba(255,250,243,0.82)', 'rgba(217,141,45,0.16)', 'rgba(139,92,246,0.10)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
        />
        <View className="relative gap-5">
          <View className="flex-row items-center gap-4">
            <IconBadge icon="spark" tone="amber" size={58} />
            <View className="flex-1 gap-2">
              <StatusPill label={t('workspace.heroTag')} tone="green" />
              <Text variant="display">{t('workspace.domain')}</Text>
            </View>
          </View>
          <Text className="text-base leading-6 text-inkSoft">{t('workspace.heroBody')}</Text>
          <Button
            testID="domain-desktop-new-session"
            accessibilityLabel={t('workspace.startVoiceSession')}
            label={t('workspace.heroCta')}
            className="self-start"
            onPress={() => {
              tapFeedback()
              startSession()
            }}
          />
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
