import { NextRequest, NextResponse } from 'next/server'
import { queryWechatOrder } from '@/features/subscription/wechat/server'
import { getPaymentByOrderNo } from '@/features/subscription/payment-service'
import { getServerClient } from '@/infra/db/client'

function normalizeWechatStatus(tradeState: string): string {
  switch (tradeState) {
    case 'SUCCESS':
      return 'paid'
    case 'CLOSED':
    case 'REVOKED':
      return 'failed'
    case 'NOTPAY':
    case 'USERPAYING':
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

    const result = await queryWechatOrder(outTradeNo)
    const normalizedStatus = normalizeWechatStatus(result.trade_state)

    return NextResponse.json({
      status: normalizedStatus,
      tradeState: result.trade_state,
    })
  } catch (error) {
    console.error('WeChat query error:', error)
    return NextResponse.json({ error: 'Failed to query WeChat order' }, { status: 500 })
  }
}
