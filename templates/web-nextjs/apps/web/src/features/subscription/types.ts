export type PlanCode = 'free' | 'pro' | 'enterprise'

export type BillingCycle = 'monthly' | 'yearly'

export type PaymentMethod = 'alipay' | 'wechat' | 'stripe'

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled'

export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled' | 'pending'

export type PaymentChannel = 'alipay_page' | 'alipay_wap' | 'wechat_native' | 'wechat_h5'

export interface SubscriptionPlan {
  id: number
  plan_code: PlanCode
  plan_name: string
  description: string | null
  price_monthly: number
  price_yearly: number
  features: Record<string, unknown>
  display_order: number
  is_active: boolean
  is_featured: boolean
  created_at: string
  updated_at: string
}

export interface UserSubscription {
  id: number
  user_id: string
  plan_id: number
  status: SubscriptionStatus
  billing_cycle: BillingCycle
  current_period_start: string | null
  current_period_end: string | null
  cancelled_at: string | null
  cancel_at_period_end: boolean
  last_payment_id: number | null
  next_billing_date: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface Payment {
  id: number
  user_id: string
  subscription_id: number | null
  order_no: string
  amount: number
  currency: string
  payment_method: PaymentMethod
  payment_channel: PaymentChannel | null
  status: PaymentStatus
  provider_trade_no: string | null
  provider_response: Record<string, unknown> | null
  paid_at: string | null
  refunded_at: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface CreatePaymentParams {
  user_id: string
  subscription_id?: number
  order_no: string
  amount: number
  currency?: string
  payment_method: PaymentMethod
  payment_channel?: PaymentChannel
  metadata?: Record<string, unknown>
}
