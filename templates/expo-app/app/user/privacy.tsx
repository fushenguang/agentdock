import { useLanguage } from '../../src/components/settings/LanguageProvider'
import { SecondaryScreen } from '../../src/components/shell/SecondaryScreen'

export default function PrivacyScreen() {
  const { t } = useLanguage()

  return <SecondaryScreen title={t('user.privacy')} body={t('user.privacyBody')} />
}
