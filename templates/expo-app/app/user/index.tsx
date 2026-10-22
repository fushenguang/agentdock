import { useRouter } from 'expo-router'
import { ScrollView, View } from 'react-native'
import { useLanguage } from '../../src/components/settings/LanguageProvider'
import {
  DetailCard,
  GlassCard,
  IconBadge,
  Section,
  SettingRow,
  Text,
} from '../../src/components/ui'
import { tapFeedback } from '../../src/lib/haptics'

export default function UserDesktop() {
  const { t, language } = useLanguage()
  const router = useRouter()

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="gap-6 px-5 pb-36 pt-4"
      showsVerticalScrollIndicator={false}
    >
      <GlassCard className="p-5">
        <View className="flex-row items-center gap-4">
          <IconBadge icon="profile" tone="violet" size={60} />
          <View className="flex-1 gap-1">
            <Text variant="display">{t('user.greeting')}</Text>
            <Text className="text-sm leading-5 text-muted">{t('user.subtitle')}</Text>
          </View>
        </View>
      </GlassCard>

      <Section title={t('user.accountGroup')}>
        <View className="gap-3">
          <SettingRow
            testID="user-language-entry"
            icon="language"
            tone="amber"
            title={t('settings.language')}
            detail={t('settings.languageDescription')}
            value={language === 'zh-CN' ? t('settings.chinese') : t('settings.english')}
            onPress={() => {
              tapFeedback()
              router.navigate('/user/profile')
            }}
          />
          <SettingRow
            testID="user-privacy-entry"
            icon="privacy"
            tone="green"
            title={t('user.privacy')}
            detail={t('privacy.toolPermissionsBody')}
            onPress={() => {
              tapFeedback()
              router.navigate('/user/privacy')
            }}
          />
        </View>
      </Section>

      <Section title={t('user.dataGroup')}>
        <View className="gap-3">
          <SettingRow
            testID="user-storage-entry"
            icon="storage"
            tone="sky"
            title={t('user.storage')}
            detail={t('storage.databaseTitle')}
            onPress={() => {
              tapFeedback()
              router.navigate('/user/storage')
            }}
          />
          <SettingRow
            testID="user-sync-entry"
            icon="sync"
            tone="violet"
            title={t('user.sync')}
            detail={t('sync.queueTitle')}
            onPress={() => {
              tapFeedback()
              router.navigate('/user/sync')
            }}
          />
          <SettingRow
            testID="user-notifications-entry"
            icon="notifications"
            tone="amber"
            title={t('user.notifications')}
            detail={t('notifications.previewTitle')}
            onPress={() => {
              tapFeedback()
              router.navigate('/user/notifications')
            }}
          />
        </View>
      </Section>

      <Section title={t('user.supportGroup')}>
        <View className="gap-3">
          <SettingRow
            testID="user-about-entry"
            icon="info"
            tone="neutral"
            title={t('user.about')}
            detail={t('about.productTitle')}
            onPress={() => {
              tapFeedback()
              router.navigate('/user/about')
            }}
          />
          <DetailCard
            icon="shield"
            tone="green"
            title={t('storage.securityTitle')}
            body={t('storage.securityBody')}
          />
        </View>
      </Section>
    </ScrollView>
  )
}
