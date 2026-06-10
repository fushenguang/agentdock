'use client'

import { useEffect, useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useUserSubscription, useUserPayments } from '@/features/subscription/hooks'
import { createBrowserClient } from '@supabase/ssr'
import type { Payment } from '@/features/subscription/types'

export default function SubscriptionPage() {
  const t = useTranslations('subscription')
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id)
      }
    })
  }, [])

  const { data: subscription } = useUserSubscription(userId || '')
  const { data: payments } = useUserPayments(userId || '')

  const handleCancel = async () => {
    if (!userId) return
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    await supabase
      .from('user_subscriptions')
      .update({ cancel_at_period_end: true })
      .eq('user_id', userId)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('currentPlan')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription ? (
            <>
              <div className="flex items-center justify-between">
                <span className="font-medium">{t('status')}</span>
                <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                  {t(subscription.status)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">{t('billingCycle')}</span>
                <span>{t(subscription.billing_cycle)}</span>
              </div>
              {subscription.current_period_end && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t('expiresOn')}</span>
                  <span>{new Date(subscription.current_period_end).toLocaleDateString()}</span>
                </div>
              )}
              {!subscription.cancel_at_period_end && (
                <Button variant="outline" onClick={handleCancel}>
                  {t('cancelRenewal')}
                </Button>
              )}
              {subscription.cancel_at_period_end && (
                <p className="text-sm text-muted-foreground">{t('cancelledAtPeriodEnd')}</p>
              )}
            </>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">{t('noActiveSubscription')}</p>
              <Button onClick={() => router.push('/pricing')}>{t('upgradeNow')}</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('paymentHistory')}</CardTitle>
        </CardHeader>
        <CardContent>
          {payments && payments.length > 0 ? (
            <div className="space-y-3">
              {payments.map((payment: Payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between border-b py-3 last:border-0"
                >
                  <div>
                    <p className="font-medium">{payment.order_no}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">¥{(payment.amount / 100).toFixed(2)}</p>
                    <Badge variant={payment.status === 'paid' ? 'default' : 'secondary'}>
                      {t(payment.status)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-6">{t('noPayments')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
