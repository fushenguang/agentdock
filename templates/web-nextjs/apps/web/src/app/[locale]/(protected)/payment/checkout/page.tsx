'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useSubscriptionPlan } from '@/features/subscription/hooks'
import { createBrowserClient } from '@supabase/ssr'

export default function CheckoutPage() {
  const t = useTranslations('payment')
  const router = useRouter()
  const searchParams = useSearchParams()
  const planCode = searchParams.get('plan') || ''
  const cycle = (searchParams.get('cycle') as 'monthly' | 'yearly') || 'monthly'

  const { data: plan, isLoading } = useSubscriptionPlan(planCode)
  const [paymentMethod, setPaymentMethod] = useState<'alipay' | 'wechat'>('alipay')
  const [coupon, setCoupon] = useState('')
  const [couponError, setCouponError] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  if (!planCode) {
    router.push('/pricing')
    return null
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-10">
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    )
  }

  const amount = cycle === 'monthly' ? plan?.price_monthly : plan?.price_yearly

  const handleSubmit = async () => {
    setIsProcessing(true)
    try {
      // Validate coupon (stub)
      if (coupon && coupon !== 'DISCOUNT10') {
        setCouponError(t('invalidCoupon'))
        setIsProcessing(false)
        return
      }
      setCouponError('')

      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Create payment record
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          planId: plan?.id,
          amount,
          paymentMethod,
          billingCycle: cycle,
        }),
      })

      if (!res.ok) throw new Error('Failed to create payment')
      const payment = await res.json()

      // Initiate payment
      if (paymentMethod === 'alipay') {
        const { initiateAlipayPayment } = await import('@/features/subscription/alipay/client')
        await initiateAlipayPayment(payment.id, user.id)
      } else {
        const { initiateWechatPayment } = await import('@/features/subscription/wechat/client')
        const result = await initiateWechatPayment(payment.id, user.id)
        if (result.type === 'qrcode') {
          router.push(`/payment/${payment.id}`)
        }
      }
    } catch (error) {
      setCouponError(t('paymentError'))
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">{t('checkoutTitle')}</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('orderSummary')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span>{t('plan')}</span>
            <span className="font-medium">{plan?.plan_name}</span>
          </div>
          <div className="flex justify-between">
            <span>{t('billingCycle')}</span>
            <span className="font-medium">{cycle === 'monthly' ? t('monthly') : t('yearly')}</span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span>{t('total')}</span>
            <span>¥{((amount || 0) / 100).toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('paymentMethod')}</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={paymentMethod}
            onValueChange={(v) => setPaymentMethod(v as 'alipay' | 'wechat')}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2 border rounded-lg p-4">
              <RadioGroupItem value="alipay" id="alipay" />
              <Label htmlFor="alipay" className="flex-1 cursor-pointer">
                {t('alipay')}
              </Label>
            </div>
            <div className="flex items-center space-x-2 border rounded-lg p-4">
              <RadioGroupItem value="wechat" id="wechat" />
              <Label htmlFor="wechat" className="flex-1 cursor-pointer">
                {t('wechatPay')}
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('coupon')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder={t('couponPlaceholder')}
            value={coupon}
            onChange={(e) => setCoupon(e.target.value)}
          />
          {couponError && <p className="text-sm text-destructive mt-2">{couponError}</p>}
        </CardContent>
      </Card>

      <Button className="w-full" size="lg" onClick={handleSubmit} disabled={isProcessing}>
        {isProcessing ? t('processing') : t('confirmPayment')}
      </Button>
    </div>
  )
}
