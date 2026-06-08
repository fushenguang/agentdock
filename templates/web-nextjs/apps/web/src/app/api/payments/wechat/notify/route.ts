import { NextRequest, NextResponse } from 'next/server'
import { verifyAndDecryptNotify } from '@/features/subscription/wechat/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPaymentByOrderNo } from '@/features/subscription/payment-service'

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const headers: Record<string, string | undefined> = {
      'wechatpay-timestamp': req.headers.get('wechatpay-timestamp') || undefined,
      'wechatpay-nonce': req.headers.get('wechatpay-nonce') || undefined,
      'wechatpay-signature': req.headers.get('wechatpay-signature') || undefined,
      'wechatpay-serial': req.headers.get('wechatpay-serial') || undefined,
    }

    const result = await verifyAndDecryptNotify(headers, rawBody)

    if (result.tradeState !== 'SUCCESS') {
      return NextResponse.json({ code: 'SUCCESS', message: '成功' })
    }

    const payment = await getPaymentByOrderNo(result.outTradeNo)
    if (!payment) {
      console.warn(`WeChat notify: payment not found for order ${result.outTradeNo}`)
      return NextResponse.json({ code: 'SUCCESS', message: '成功' })
    }

    // Validate mch_id matches our configured merchant
    if (result.mchId !== process.env.WECHAT_PAY_MCH_ID) {
      console.warn(`WeChat notify: mch_id mismatch. received=${result.mchId}`)
      return NextResponse.json({ code: 'FAIL', message: 'mch_id mismatch' }, { status: 400 })
    }

    // Validate appid matches our configured app
    if (result.appId !== process.env.WECHAT_PAY_APP_ID) {
      console.warn(`WeChat notify: appid mismatch. received=${result.appId}`)
      return NextResponse.json({ code: 'FAIL', message: 'appid mismatch' }, { status: 400 })
    }

    // Validate amount matches the local order
    if (result.amount !== payment.amount) {
      console.warn(
        `WeChat notify: amount mismatch. order=${result.outTradeNo}, expected=${payment.amount}, received=${result.amount}`,
      )
      return NextResponse.json({ code: 'FAIL', message: 'amount mismatch' }, { status: 400 })
    }

    // Idempotency
    if (payment.status === 'paid') {
      return NextResponse.json({ code: 'SUCCESS', message: '成功' })
    }

    const supabase = createAdminClient()

    // Update payment with provider_trade_no and conditional update
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'paid',
        provider_trade_no: result.transactionId,
        paid_at: new Date().toISOString(),
      })
      .eq('order_no', result.outTradeNo)
      .eq('status', 'pending')

    if (updateError) {
      console.error('WeChat notify: failed to update payment', updateError)
      return NextResponse.json({ code: 'FAIL', message: 'update failed' }, { status: 500 })
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

    return NextResponse.json({ code: 'SUCCESS', message: '成功' })
  } catch (error) {
    console.error('WeChat notify error:', error)
    return NextResponse.json({ code: 'FAIL', message: (error as Error).message }, { status: 500 })
  }
}
