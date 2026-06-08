import { NextRequest, NextResponse } from 'next/server'
import { createPaymentRecord, getPaymentByOrderNo } from '@/features/subscription/payment-service'
import { getServerClient } from '@/infra/db/client'
import { generateOrderNumber } from '@/features/subscription/payment-helpers'

export async function POST(req: NextRequest) {
  try {
    const supabase = await getServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json()) as {
      planId: number
      amount: number
      paymentMethod: string
      billingCycle: string
    }

    if (!body.planId || !body.amount || !body.paymentMethod || !body.billingCycle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const orderNo = generateOrderNumber()

    const payment = await createPaymentRecord({
      user_id: user.id,
      order_no: orderNo,
      amount: body.amount,
      currency: 'CNY',
      payment_method: body.paymentMethod as 'alipay' | 'wechat',
      metadata: {
        plan_id: body.planId,
        billing_cycle: body.billingCycle,
      },
    })

    return NextResponse.json({
      id: payment.id,
      orderNo: payment.order_no,
      amount: payment.amount,
      status: payment.status,
    })
  } catch (error) {
    console.error('Payment creation error:', error)
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
  }
}
