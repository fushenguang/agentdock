'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ThemeToggle } from '@/components/ui/theme-toggle'

interface HeaderProps {
  locale: string
}

export function Header({ locale }: HeaderProps) {
  const t = useTranslations('landing')
  const [open, setOpen] = useState(false)

  const navLinks = [
    { href: `/${locale}/#features`, label: t('nav.features') },
    { href: `/${locale}/#pricing`, label: t('nav.pricing') },
    { href: '/docs', label: t('nav.docs') },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-(--header-height, 4rem) max-w-7xl items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-tight">AgentDock</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Button variant="ghost" asChild size="sm" className="min-h-[44px]">
            <Link href={`/${locale}/login`}>{t('nav.login')}</Link>
          </Button>
          <Button asChild size="sm" className="min-h-[44px]">
            <Link href={`/${locale}/signup`}>{t('nav.getStarted')}</Link>
          </Button>
        </div>

        {/* Mobile Menu */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <nav className="mt-8 flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="text-base font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
                <hr className="my-2" />
                <Button asChild className="w-full min-h-[44px]">
                  <Link href={`/${locale}/signup`} onClick={() => setOpen(false)}>
                    {t('nav.getStarted')}
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full min-h-[44px]">
                  <Link href={`/${locale}/login`} onClick={() => setOpen(false)}>
                    {t('nav.login')}
                  </Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
