import { View } from 'react-native'
import { SecondaryScreen } from '../../src/components/shell/SecondaryScreen'
import { useLanguage } from '../../src/components/settings/LanguageProvider'
import { DetailCard } from '../../src/components/ui'

export default function SyncScreen() {
  const { t } = useLanguage()
  return (
    <SecondaryScreen title={t('user.sync')} body={t('user.syncBody')} icon="sync" tone="violet">
      <View className="gap-3">
        <DetailCard
          icon="sync"
          tone="violet"
          title={t('sync.queueTitle')}
          body={t('sync.queueBody')}
        />
        <DetailCard
          icon="user"
          tone="amber"
          title={t('sync.controlTitle')}
          body={t('sync.controlBody')}
        />
        <DetailCard
          icon="activity"
          tone="sky"
          title={t('sync.auditTitle')}
          body={t('sync.auditBody')}
        />
      </View>
    </SecondaryScreen>
  )
}
