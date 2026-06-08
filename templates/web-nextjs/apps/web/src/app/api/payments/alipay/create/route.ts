import { NextRequest, NextResponse } from 'next/server'
import { createAlipayPagePay, createAlipayWapPay } from '@/features/subscription/alipay/server'
import { getPaymentById } from '@/features/subscription/payment-service'

export async function POST(req: NextRequest) {
  try {
    const { paymentId } = (await req.json()) as { paymentId: number }

    const payment = await getPaymentById(paymentId)
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    const userAgent = req.headers.get('user-agent') || ''
    const isMobile = /Mobile|Android|iPhone/i.test(userAgent)

    const notifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/alipay/notify`
    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/${payment.id}`

    if (isMobile) {
      const result = await createAlipayWapPay({
        outTradeNo: payment.order_no,
        totalAmount: String(payment.amount / 100),
        subject: 'Subscription',
        returnUrl,
        notifyUrl,
      })
      return NextResponse.json({ redirectUrl: result.redirectUrl })
    } else {
      const result = await createAlipayPagePay({
        outTradeNo: payment.order_no,
        totalAmount: String(payment.amount / 100),
        subject: 'Subscription',
        returnUrl,
        notifyUrl,
      })
      return NextResponse.json({ formHtml: result.formHtml })
    }
  } catch (error) {
    console.error('Alipay create error:', error)
    return NextResponse.json({ error: 'Failed to create Alipay payment' }, { status: 500 })
  }
}
