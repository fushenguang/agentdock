import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

export function PricingTeaser() {
  const t = useTranslations('landing')

  return (
    <section
      id="pricing"
      className="px-4 py-16 md:py-24"
      style={{ padding: 'clamp(32px, 8vw, 80px) 0' }}
    >
      <div className="mx-auto max-w-3xl px-4 text-center md:px-6">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{t('pricing.title')}</h2>
        <p className="mt-4 text-muted-foreground">{t('pricing.description')}</p>
        <Button asChild className="mt-8 min-h-[44px] min-w-[44px]">
          <a href="mailto:contact@agentdock.dev">{t('pricing.cta')}</a>
        </Button>
        {/* TODO: Integrate Stripe, see add-stripe-payments change */}
      </div>
    </section>
  )
}
