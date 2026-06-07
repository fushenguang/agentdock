import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface HeroProps {
  locale: string
}

export function Hero({ locale }: HeroProps) {
  const t = useTranslations('landing')

  return (
    <section className="relative overflow-hidden px-4 py-16 md:py-24 lg:py-32">
      <div className="mx-auto max-w-4xl text-center">
        <Badge variant="secondary" className="mb-4">
          {t('hero.badge')}
        </Badge>
        <h1
          className="mx-auto max-w-3xl font-bold tracking-tight"
          style={{ fontSize: 'clamp(2rem, 5vw + 1rem, 4rem)', lineHeight: 1.1 }}
        >
          {t('hero.title')}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
          {t('hero.subtitle')}
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild size="lg" className="min-h-[44px] min-w-[44px] px-8">
            <Link href={`/${locale}/signup`}>{t('hero.ctaPrimary')}</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="min-h-[44px] min-w-[44px] px-8">
            <Link href="/docs">{t('hero.ctaSecondary')}</Link>
          </Button>
        </div>
      </div>

      {/* Decorative geometric shapes - CSS only, no custom SVG */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-30">
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-gradient-to-tl from-primary/10 to-transparent blur-3xl" />
      </div>
    </section>
  )
}
