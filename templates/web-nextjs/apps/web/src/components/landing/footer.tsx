import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { IconBrandGithub } from '@tabler/icons-react'

interface FooterProps {
  locale: string
}

export function Footer({ locale }: FooterProps) {
  const t = useTranslations('landing')
  const year = new Date().getFullYear()

  const links = [
    { href: `/${locale}/help`, label: t('footer.help') },
    { href: `/${locale}/privacy`, label: t('footer.privacy') },
    { href: `/${locale}/about`, label: t('footer.about') },
  ]

  return (
    <footer className="border-t bg-background px-4 py-8 md:py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row md:px-6">
        <div className="flex items-center gap-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <IconBrandGithub className="h-5 w-5" />
          </a>
          <span className="text-sm text-muted-foreground">{t('footer.copyright', { year })}</span>
        </div>
      </div>
    </footer>
  )
}
