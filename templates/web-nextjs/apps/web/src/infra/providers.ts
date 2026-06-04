import { SupabaseAuthRepository } from './db/SupabaseAuthRepository'
import type { IAuthRepository } from '@/core/repositories/IAuthRepository'

export function getAuthRepository(): IAuthRepository {
  return new SupabaseAuthRepository()
}
