import { useTranslations } from 'next-intl'

export function HowItWorks() {
  const t = useTranslations('landing')

  const steps = [
    { key: 'step1', number: '01' },
    { key: 'step2', number: '02' },
    { key: 'step3', number: '03' },
  ]

  return (
    <section className="px-4 py-16 md:py-24" style={{ padding: 'clamp(32px, 8vw, 80px) 0' }}>
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{t('howItWorks.title')}</h2>
          <p className="mt-4 text-muted-foreground">{t('howItWorks.subtitle')}</p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.key} className="relative text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                {step.number}
              </div>
              <h3 className="text-lg font-semibold">{t(`howItWorks.steps.${step.key}.title`)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t(`howItWorks.steps.${step.key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
