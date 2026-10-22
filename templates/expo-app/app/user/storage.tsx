import { useLanguage } from '../../src/components/settings/LanguageProvider'
import { SecondaryScreen } from '../../src/components/shell/SecondaryScreen'

export default function StorageScreen() {
  const { t } = useLanguage()

  return <SecondaryScreen title={t('user.storage')} body={t('user.storageBody')} />
}
