import { getBrowserClient, getServerClient } from '@/infra/db/client'
import type { SubscriptionPlan, UserSubscription } from './types'

export async function getActiveSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) throw error
  return (data as SubscriptionPlan[]) ?? []
}

export async function getSubscriptionPlanByCode(
  planCode: string,
): Promise<SubscriptionPlan | null> {
  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('plan_code', planCode)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return (data as SubscriptionPlan) ?? null
}

export async function getUserActiveSubscription(userId: string): Promise<UserSubscription | null> {
  const supabase = await getServerClient()
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
}

export async function getUserSubscriptionHistory(userId: string): Promise<UserSubscription[]> {
  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as UserSubscription[]) ?? []
}
