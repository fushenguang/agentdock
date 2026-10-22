import { useLanguage } from '../../src/components/settings/LanguageProvider'
import { SecondaryScreen } from '../../src/components/shell/SecondaryScreen'

export default function AboutScreen() {
  const { t } = useLanguage()

  return <SecondaryScreen title={t('user.about')} body={t('user.aboutBody')} />
}
