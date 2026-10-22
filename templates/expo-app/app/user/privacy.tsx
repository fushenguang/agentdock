import { View } from 'react-native'
import { SecondaryScreen } from '../../src/components/shell/SecondaryScreen'
import { useLanguage } from '../../src/components/settings/LanguageProvider'
import { DetailCard } from '../../src/components/ui'

export default function PrivacyScreen() {
  const { t } = useLanguage()
  return (
    <SecondaryScreen
      title={t('user.privacy')}
      body={t('user.privacyBody')}
      icon="privacy"
      tone="green"
    >
      <View className="gap-3">
        <DetailCard
          icon="storage"
          tone="sky"
          title={t('privacy.localDataTitle')}
          body={t('privacy.localDataBody')}
        />
        <DetailCard
          icon="shield"
          tone="green"
          title={t('privacy.toolPermissionsTitle')}
          body={t('privacy.toolPermissionsBody')}
        />
        <DetailCard
          icon="info"
          tone="neutral"
          title={t('privacy.deletionTitle')}
          body={t('privacy.deletionBody')}
        />
      </View>
    </SecondaryScreen>
  )
}
