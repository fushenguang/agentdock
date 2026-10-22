import { useLanguage } from '../../src/components/settings/LanguageProvider'
import { SecondaryScreen } from '../../src/components/shell/SecondaryScreen'

export default function SyncScreen() {
  const { t } = useLanguage()

  return <SecondaryScreen title={t('user.sync')} body={t('user.syncBody')} />
}
