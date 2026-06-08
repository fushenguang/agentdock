import { NextRequest, NextResponse } from 'next/server'
import { getPaymentByOrderNo } from '@/features/subscription/payment-service'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const outTradeNo = url.searchParams.get('out_trade_no')

  if (!outTradeNo) {
    return NextResponse.redirect(new URL('/pricing', req.url))
  }

  // Lookup payment by order_no to get the numeric ID for the status page
  const payment = await getPaymentByOrderNo(outTradeNo)
  if (!payment) {
    return NextResponse.redirect(new URL('/pricing', req.url))
  }

  // Redirect to payment status page using the numeric payment ID
  return NextResponse.redirect(new URL(`/payment/${payment.id}`, req.url))
}
