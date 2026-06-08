import { NextRequest, NextResponse } from 'next/server'
import { createWechatNativePay, createWechatH5Pay } from '@/features/subscription/wechat/server'
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

    // In development, always use native (qrcode) even on mobile (D3)
    const forceNative = process.env.NODE_ENV === 'development' && isMobile

    const notifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/wechat/notify`

    if (!isMobile || forceNative) {
      // Native (PC) - return QR code URL
      const result = await createWechatNativePay({
        description: 'Subscription',
        outTradeNo: payment.order_no,
        notifyUrl,
        amount: { total: payment.amount, currency: 'CNY' },
      })

      if (forceNative) {
        return NextResponse.json({
          type: 'qrcode',
          codeUrl: result.code_url,
          warning: 'H5 disabled in dev',
        })
      }

      return NextResponse.json({ type: 'qrcode', codeUrl: result.code_url })
    } else {
      // H5 (mobile)
      const result = await createWechatH5Pay({
        description: 'Subscription',
        outTradeNo: payment.order_no,
        notifyUrl,
        amount: { total: payment.amount, currency: 'CNY' },
        sceneInfo: {
          payer_client_ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1',
        },
      })

      return NextResponse.json({ type: 'redirect', h5Url: result.h5_url })
    }
  } catch (error) {
    console.error('WeChat create error:', error)
    return NextResponse.json({ error: 'Failed to create WeChat payment' }, { status: 500 })
  }
}
