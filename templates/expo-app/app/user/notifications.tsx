import { useLanguage } from '../../src/components/settings/LanguageProvider'
import { SecondaryScreen } from '../../src/components/shell/SecondaryScreen'

export default function NotificationsScreen() {
  const { t } = useLanguage()

  return <SecondaryScreen title={t('user.notifications')} body={t('user.notificationsBody')} />
}
