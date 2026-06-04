import type { AuthResult, AuthUser } from '@/core/types/auth'

export interface IAuthRepository {
  signInWithPassword(email: string, password: string): Promise<AuthResult>
  signUp(email: string, password: string): Promise<AuthResult>
  signOut(): Promise<void>
  getSession(): Promise<AuthUser | null>
  signInWithOAuth(provider: 'github', nextPath?: string): Promise<{ url: string }>
}
