import { useTranslations } from 'next-intl'
import { Header } from '@/components/landing/header'
import { Hero } from '@/components/landing/hero'
import { Features } from '@/components/landing/features'
import { HowItWorks } from '@/components/landing/how-it-works'
import { PricingTeaser } from '@/components/landing/pricing-teaser'
import { Footer } from '@/components/landing/footer'

export default function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  return <HomePageContent params={params} />
}

async function HomePageContent({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  return (
    <div className="flex min-h-screen flex-col">
      <Header locale={locale} />
      <main className="flex-1">
        <Hero locale={locale} />
        <Features />
        <HowItWorks />
        <PricingTeaser />
      </main>
      <Footer locale={locale} />
    </div>
  )
}
