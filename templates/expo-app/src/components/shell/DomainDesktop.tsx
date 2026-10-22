import { ScrollView, View } from 'react-native'
import { useAgentSession } from '../agent'
import { useLanguage } from '../settings/LanguageProvider'
import { Button, Card, Section, Text } from '../ui'

export function DomainDesktop() {
  const { startSession } = useAgentSession()
  const { t } = useLanguage()

  return (
    <ScrollView
      testID="domain-desktop"
      className="flex-1"
      contentContainerClassName="gap-8 px-5 pb-32"
    >
      <View className="gap-3 pt-4">
        <Text variant="display">{t('workspace.domain')}</Text>
        <Text variant="muted">{t('workspace.domainDescription')}</Text>
      </View>

      <Section title={t('workspace.domainSurface')}>
        <View className="gap-4">
          <Card>
            <Text variant="title">{t('workspace.domainPackage')}</Text>
            <Text className="mt-2">{t('workspace.domainPackageBody')}</Text>
          </Card>
          <Card>
            <Text variant="title">{t('workspace.agentCapabilities')}</Text>
            <Text className="mt-2">{t('workspace.agentCapabilitiesBody')}</Text>
          </Card>
        </View>
      </Section>

      <Section title={t('workspace.primaryAction')}>
        <Card className="items-start bg-accent/10">
          <Text variant="title">{t('workspace.startVoiceSession')}</Text>
          <Text className="mt-2">{t('workspace.startVoiceSessionBody')}</Text>
          <Button
            testID="domain-desktop-new-session"
            accessibilityLabel={t('workspace.newSession')}
            label={t('workspace.newSession')}
            variant="ghost"
            className="mt-4 self-start"
            onPress={startSession}
          />
        </Card>
      </Section>
    </ScrollView>
  )
}
