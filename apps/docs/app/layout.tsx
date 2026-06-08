import { RootProvider } from 'fumadocs-ui/provider/next'
import './global.css'
import { Inter } from 'next/font/google'
import type { Metadata } from 'next'

const inter = Inter({
  subsets: ['latin'],
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
}

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="zh" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider
          i18n={{
            locale: 'zh',
            locales: [
              { locale: 'zh', name: '中文' },
              { locale: 'en', name: 'English' },
            ],
          }}
        >
          {children}
        </RootProvider>
      </body>
    </html>
  )
}
