'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { usePaymentStatus } from '@/features/subscription/hooks'
import { createBrowserClient } from '@supabase/ssr'

export default function PaymentStatusPage() {
  const t = useTranslations('payment')
  const router = useRouter()
  const params = useParams()
  const paymentId = params.paymentId as string

  const [paymentMethod, setPaymentMethod] = useState<string>('')
  const [orderNo, setOrderNo] = useState<string>('')

  useEffect(() => {
    async function fetchPayment() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
      const { data } = await supabase.from('payments').select('*').eq('id', paymentId).single()

      if (data) {
        setPaymentMethod(data.payment_method)
        setOrderNo(data.order_no)
      }
    }
    fetchPayment()
  }, [paymentId])

  const { data: paymentStatus } = usePaymentStatus(orderNo, paymentMethod, {
    enabled: !!orderNo && !!paymentMethod,
  })

  const status = paymentStatus?.status || 'pending'

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">{t('statusTitle')}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {t('paymentStatus')}
            <Badge
              variant={
                status === 'paid' ? 'default' : status === 'failed' ? 'destructive' : 'secondary'
              }
            >
              {t(status)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === 'paid' && (
            <div className="text-center space-y-4">
              <div className="text-6xl">✓</div>
              <p className="text-lg font-medium">{t('paymentSuccess')}</p>
              <Button onClick={() => router.push('/dashboard')}>{t('goToDashboard')}</Button>
            </div>
          )}

          {status === 'failed' && (
            <div className="text-center space-y-4">
              <div className="text-6xl">✗</div>
              <p className="text-lg font-medium">{t('paymentFailed')}</p>
              <Button onClick={() => router.push('/pricing')}>{t('tryAgain')}</Button>
            </div>
          )}

          {status === 'pending' && (
            <div className="text-center space-y-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
              <p className="text-lg font-medium">{t('paymentPending')}</p>
              <p className="text-sm text-muted-foreground">{t('paymentPendingDescription')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
