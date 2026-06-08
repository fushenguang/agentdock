import { I18nProvider } from 'fumadocs-ui/contexts/i18n'

interface LayoutParams {
  lang: string
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<LayoutParams>
}) {
  const { lang } = await params

  return (
    <I18nProvider
      locale={lang}
      locales={[
        { locale: 'zh', name: '中文' },
        { locale: 'en', name: 'English' },
      ]}
    >
      {children}
    </I18nProvider>
  )
}
