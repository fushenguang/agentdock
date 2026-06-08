import { NextRequest, NextResponse } from 'next/server'
import { queryAlipayOrder } from '@/features/subscription/alipay/server'
import { getPaymentByOrderNo } from '@/features/subscription/payment-service'
import { getServerClient } from '@/infra/db/client'

function normalizeAlipayStatus(tradeStatus: string): string {
  switch (tradeStatus) {
    case 'TRADE_SUCCESS':
    case 'TRADE_FINISHED':
      return 'paid'
    case 'TRADE_CLOSED':
      return 'failed'
    case 'WAIT_BUYER_PAY':
    default:
      return 'pending'
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await getServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { outTradeNo } = (await req.json()) as { outTradeNo: string }

    // Verify order ownership
    const payment = await getPaymentByOrderNo(outTradeNo)
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    if (payment.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const result = await queryAlipayOrder(outTradeNo)
    const normalizedStatus = normalizeAlipayStatus(result.tradeStatus)

    return NextResponse.json({
      status: normalizedStatus,
      tradeStatus: result.tradeStatus,
      code: result.code,
    })
  } catch (error) {
    console.error('Alipay query error:', error)
    return NextResponse.json({ error: 'Failed to query Alipay order' }, { status: 500 })
  }
}
