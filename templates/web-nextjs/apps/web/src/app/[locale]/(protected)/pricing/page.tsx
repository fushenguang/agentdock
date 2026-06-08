'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSubscriptionPlans, useUserSubscription } from '@/features/subscription/hooks'
import { createBrowserClient } from '@supabase/ssr'

export default function PricingPage() {
  const t = useTranslations('pricing')
  const router = useRouter()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  const { data: plans, isLoading: plansLoading } = useSubscriptionPlans()
  const [user, setUser] = useState<{ id: string } | null>(null)

  // Fetch current user
  useState(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({ id: data.user.id })
      }
    })
  })

  const { data: currentSubscription } = useUserSubscription(user?.id || '')

  const handleSelectPlan = (planCode: string) => {
    router.push(`/payment/checkout?plan=${planCode}&cycle=${billingCycle}`)
  }

  if (plansLoading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-10">
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-4">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <Tabs
        value={billingCycle}
        onValueChange={(v) => setBillingCycle(v as 'monthly' | 'yearly')}
        className="w-full max-w-md mx-auto mb-10"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="monthly">{t('monthly')}</TabsTrigger>
          <TabsTrigger value="yearly">{t('yearly')}</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans?.map((plan) => {
          const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly
          const isCurrentPlan = currentSubscription?.plan_id === plan.id

          return (
            <Card
              key={plan.id}
              className={isCurrentPlan ? 'border-primary ring-1 ring-primary' : ''}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.plan_name}</CardTitle>
                  {isCurrentPlan && <Badge>{t('currentPlan')}</Badge>}
                  {plan.is_featured && <Badge variant="secondary">{t('popular')}</Badge>}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {price === 0 ? t('free') : `¥${(price / 100).toFixed(2)}`}
                  {price > 0 && (
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      /{billingCycle === 'monthly' ? t('perMonth') : t('perYear')}
                    </span>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                {isCurrentPlan ? (
                  <Button variant="outline" className="w-full" disabled>
                    {t('currentPlan')}
                  </Button>
                ) : (
                  <Button className="w-full" onClick={() => handleSelectPlan(plan.plan_code)}>
                    {price === 0 ? t('getStarted') : t('upgrade')}
                  </Button>
                )}
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
