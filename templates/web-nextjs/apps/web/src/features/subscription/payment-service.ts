import { getServerClient } from '@/infra/db/client'
import type { Payment, CreatePaymentParams } from './types'

export async function createPaymentRecord(params: CreatePaymentParams): Promise<Payment> {
  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from('payments')
    .insert({
      user_id: params.user_id,
      subscription_id: params.subscription_id ?? null,
      order_no: params.order_no,
      amount: params.amount,
      currency: params.currency ?? 'CNY',
      payment_method: params.payment_method,
      payment_channel: params.payment_channel ?? null,
      status: 'pending',
      metadata: params.metadata ?? {},
    })
    .select()
    .single()

  if (error) throw error
  return data as Payment
}

export async function getPaymentByOrderNo(orderNo: string): Promise<Payment | null> {
  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('order_no', orderNo)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return (data as Payment) ?? null
}

export async function getPaymentById(id: number): Promise<Payment | null> {
  const supabase = await getServerClient()
  const { data, error } = await supabase.from('payments').select('*').eq('id', id).single()

  if (error && error.code !== 'PGRST116') throw error
  return (data as Payment) ?? null
}

export async function getUserPayments(userId: string): Promise<Payment[]> {
  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as Payment[]) ?? []
}
