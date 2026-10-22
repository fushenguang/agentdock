import { View } from 'react-native'
import { SecondaryScreen } from '../../src/components/shell/SecondaryScreen'
import { useLanguage } from '../../src/components/settings/LanguageProvider'
import { DetailCard } from '../../src/components/ui'

export default function NotificationsScreen() {
  const { t } = useLanguage()
  return (
    <SecondaryScreen
      title={t('user.notifications')}
      body={t('user.notificationsBody')}
      icon="notifications"
      tone="amber"
    >
      <View className="gap-3">
        <DetailCard
          icon="agent"
          tone="amber"
          title={t('notifications.completionTitle')}
          body={t('notifications.completionBody')}
        />
        <DetailCard
          icon="shield"
          tone="green"
          title={t('notifications.permissionTitle')}
          body={t('notifications.permissionBody')}
        />
        <DetailCard
          icon="notifications"
          tone="sky"
          title={t('notifications.previewTitle')}
          body={t('notifications.previewBody')}
        />
      </View>
    </SecondaryScreen>
  )
}
