import { NextRequest, NextResponse } from 'next/server'
import { verifyAlipayNotify } from '@/features/subscription/alipay/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPaymentByOrderNo } from '@/features/subscription/payment-service'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const data: Record<string, unknown> = {}
    formData.forEach((value, key) => {
      data[key] = value
    })

    const isValid = await verifyAlipayNotify(data)
    if (!isValid) {
      return new NextResponse('fail', { status: 400 })
    }

    const outTradeNo = data.out_trade_no as string
    const tradeStatus = data.trade_status as string
    const tradeNo = data.trade_no as string
    const totalAmount = data.total_amount as string
    const appId = data.app_id as string
    const sellerId = data.seller_id as string

    // Validate critical business fields against the local order
    const payment = await getPaymentByOrderNo(outTradeNo)
    if (!payment) {
      console.warn(`Alipay notify: payment not found for order ${outTradeNo}`)
      return new NextResponse('success', { status: 200 })
    }

    // Verify app_id matches our configured app
    if (appId !== process.env.ALIPAY_APP_ID) {
      console.warn(
        `Alipay notify: app_id mismatch. received=${appId}, expected=${process.env.ALIPAY_APP_ID}`,
      )
      return new NextResponse('fail', { status: 400 })
    }

    // Verify amount matches the local order (convert to cents for comparison)
    const notifyAmountCents = Math.round(parseFloat(totalAmount) * 100)
    if (notifyAmountCents !== payment.amount) {
      console.warn(
        `Alipay notify: amount mismatch. order=${outTradeNo}, expected=${payment.amount}, received=${notifyAmountCents}`,
      )
      return new NextResponse('fail', { status: 400 })
    }

    // Verify seller_id if configured
    if (process.env.ALIPAY_SELLER_ID && sellerId !== process.env.ALIPAY_SELLER_ID) {
      console.warn(`Alipay notify: seller_id mismatch. received=${sellerId}`)
      return new NextResponse('fail', { status: 400 })
    }

    if (tradeStatus !== 'TRADE_SUCCESS') {
      return new NextResponse('success', { status: 200 })
    }

    // Idempotency: already paid
    if (payment.status === 'paid') {
      return new NextResponse('success', { status: 200 })
    }

    const supabase = createAdminClient()

    // Update payment with provider_trade_no unique constraint check
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'paid',
        provider_trade_no: tradeNo,
        paid_at: new Date().toISOString(),
        provider_response: data as Record<string, unknown>,
      })
      .eq('order_no', outTradeNo)
      .eq('status', 'pending')

    if (updateError) {
      console.error('Alipay notify: failed to update payment', updateError)
      return new NextResponse('fail', { status: 500 })
    }

    // Update subscription
    if (payment.subscription_id) {
      const now = new Date()
      const nextMonth = new Date(now)
      nextMonth.setMonth(nextMonth.getMonth() + 1)

      await supabase
        .from('user_subscriptions')
        .update({
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: nextMonth.toISOString(),
        })
        .eq('id', payment.subscription_id)
    }

    return new NextResponse('success', { status: 200 })
  } catch (error) {
    console.error('Alipay notify error:', error)
    return new NextResponse('fail', { status: 500 })
  }
}
