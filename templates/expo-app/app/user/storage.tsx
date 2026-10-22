import { View } from 'react-native'
import { SecondaryScreen } from '../../src/components/shell/SecondaryScreen'
import { useLanguage } from '../../src/components/settings/LanguageProvider'
import { DetailCard } from '../../src/components/ui'

export default function StorageScreen() {
  const { t } = useLanguage()
  return (
    <SecondaryScreen
      title={t('user.storage')}
      body={t('user.storageBody')}
      icon="storage"
      tone="sky"
    >
      <View className="gap-3">
        <DetailCard
          icon="storage"
          tone="sky"
          title={t('storage.databaseTitle')}
          body={t('storage.databaseBody')}
        />
        <DetailCard
          icon="sync"
          tone="violet"
          title={t('storage.queueTitle')}
          body={t('storage.queueBody')}
        />
        <DetailCard
          icon="shield"
          tone="green"
          title={t('storage.securityTitle')}
          body={t('storage.securityBody')}
        />
      </View>
    </SecondaryScreen>
  )
}
