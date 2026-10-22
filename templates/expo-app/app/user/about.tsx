import { View } from 'react-native'
import { SecondaryScreen } from '../../src/components/shell/SecondaryScreen'
import { useLanguage } from '../../src/components/settings/LanguageProvider'
import { DetailCard } from '../../src/components/ui'

export default function AboutScreen() {
  const { t } = useLanguage()
  return (
    <SecondaryScreen title={t('user.about')} body={t('user.aboutBody')} icon="info" tone="neutral">
      <View className="gap-3">
        <DetailCard
          icon="spark"
          tone="amber"
          title={t('about.productTitle')}
          body={t('about.productBody')}
        />
        <DetailCard
          icon="layers"
          tone="violet"
          title={t('about.designTitle')}
          body={t('about.designBody')}
        />
        <DetailCard
          icon="metrics"
          tone="sky"
          title={t('about.nextTitle')}
          body={t('about.nextBody')}
        />
      </View>
    </SecondaryScreen>
  )
}
