import type { IGreetingRepository } from '@/core/repositories/IGreetingRepository'
import type { Greeting } from '@/core/types/greeting'
import { getServerClient } from './client'

/**
 * Supabase implementation of IGreetingRepository.
 * Operates on the `greetings` table.
 *
 * Table schema (create in Supabase SQL editor):
 * ```sql
 * create table greetings (
 *   id uuid primary key default gen_random_uuid(),
 *   name text not null,
 *   created_at timestamptz not null default now()
 * );
 * ```
 */
export class SupabaseGreetingRepository implements IGreetingRepository {
  async save(name: string): Promise<Greeting> {
    const supabase = await getServerClient()

    const { data, error } = await supabase
      .from('greetings')
      .insert({ name })
      .select('id, name, created_at')
      .single()

    if (error !== null || data === null) {
      throw new Error(`Failed to save greeting: ${error?.message ?? 'unknown'}`)
    }

    return {
      id: data.id as string,
      name: data.name as string,
      createdAt: (data.created_at as string) ?? new Date().toISOString(),
    }
  }

  async findRecent(): Promise<Greeting[]> {
    const supabase = await getServerClient()

    const { data, error } = await supabase
      .from('greetings')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error !== null) {
      throw new Error(`Failed to fetch greetings: ${error.message}`)
    }

    return (data ?? []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      createdAt: (row.created_at as string) ?? '',
    }))
  }
}
