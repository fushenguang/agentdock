import { useTranslations } from 'next-intl'
import { Header } from '@/components/landing/header'
import { Hero } from '@/components/landing/hero'
import { Features } from '@/components/landing/features'
import { HowItWorks } from '@/components/landing/how-it-works'
import { PricingTeaser } from '@/components/landing/pricing-teaser'
import { Footer } from '@/components/landing/footer'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <Features />
        <HowItWorks />
        <PricingTeaser />
      </main>
      <Footer />
    </div>
  )
}
