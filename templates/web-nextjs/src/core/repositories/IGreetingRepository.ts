import type { Greeting } from '../types/greeting'

/**
 * Repository interface for Greeting persistence.
 * Uses domain types only — no Supabase types leak through.
 * Implement this in src/infra/db/ to swap storage backends.
 */
export interface IGreetingRepository {
  /** Persist a new greeting and return the saved record. */
  save(name: string): Promise<Greeting>

  /** Return the most recent greeting records. */
  findRecent(): Promise<Greeting[]>
}
