'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Payment, SubscriptionPlan, UserSubscription } from './types'

function createSupabaseClient() {
  return import('@supabase/ssr').then(({ createBrowserClient }) =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    ),
  )
}

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async (): Promise<SubscriptionPlan[]> => {
      const supabase = await createSupabaseClient()
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (error) throw error
      return (data as SubscriptionPlan[]) ?? []
    },
  })
}

export function useSubscriptionPlan(planCode: string) {
  return useQuery({
    queryKey: ['subscription-plan', planCode],
    queryFn: async (): Promise<SubscriptionPlan | null> => {
      const supabase = await createSupabaseClient()
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('plan_code', planCode)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return (data as SubscriptionPlan) ?? null
    },
  })
}

export function useUserSubscription(userId: string) {
  return useQuery({
    queryKey: ['user-subscription', userId],
    queryFn: async (): Promise<UserSubscription | null> => {
      const supabase = await createSupabaseClient()
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['trial', 'active'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return (data as UserSubscription) ?? null
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!userId,
  })
}

export function useUserPayments(userId: string) {
  return useQuery({
    queryKey: ['user-payments', userId],
    queryFn: async (): Promise<Payment[]> => {
      const supabase = await createSupabaseClient()
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data as Payment[]) ?? []
    },
    enabled: !!userId,
  })
}

interface PaymentStatusResult {
  status: string
}

export function usePaymentStatus(
  orderNo: string,
  paymentMethod: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ['payment-status', orderNo],
    queryFn: async (): Promise<PaymentStatusResult> => {
      const endpoint =
        paymentMethod === 'alipay' ? '/api/payments/alipay/query' : '/api/payments/wechat/query'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outTradeNo: orderNo }),
      })
      if (!res.ok) throw new Error('Failed to query payment status')
      return res.json() as Promise<PaymentStatusResult>
    },
    refetchInterval: 3000,
    enabled: options?.enabled ?? !!orderNo,
  })
}

interface CreatePaymentParams {
  userId: string
  planId: number
  amount: number
  paymentMethod: string
  billingCycle: string
}

export function useCreatePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: CreatePaymentParams) => {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })
      if (!res.ok) throw new Error('Failed to create payment')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-payments'] })
    },
  })
}
