'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { User, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const t = useTranslations('settings')
  const pathname = usePathname()

  const navItems = [
    { href: '/settings/profile', label: t('profileTitle'), icon: User },
    { href: '/settings/subscription', label: t('subscriptionTitle'), icon: CreditCard },
  ]

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-8 md:flex-row">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  )
}
