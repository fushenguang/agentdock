import { useTranslations } from 'next-intl'
import { Shield, GitBranch, Bot, BookOpen } from 'lucide-react'

const icons = [Shield, GitBranch, Bot, BookOpen]

export function Features() {
  const t = useTranslations('landing')

  const features = [
    {
      key: 'auth',
      icon: Shield,
    },
    {
      key: 'monorepo',
      icon: GitBranch,
    },
    {
      key: 'aiCoding',
      icon: Bot,
    },
    {
      key: 'docs',
      icon: BookOpen,
    },
  ]

  return (
    <section
      id="features"
      className="px-4 py-16 md:py-24"
      style={{ padding: 'clamp(32px, 8vw, 80px) 0' }}
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{t('features.title')}</h2>
          <p className="mt-4 text-muted-foreground">{t('features.subtitle')}</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.key}
                className="group rounded-xl border bg-card p-6 transition-colors hover:border-primary/20"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">
                  {t(`features.items.${feature.key}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t(`features.items.${feature.key}.description`)}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
