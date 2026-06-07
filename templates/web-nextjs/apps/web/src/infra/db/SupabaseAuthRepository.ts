import type { IAuthRepository } from '@/core/repositories/IAuthRepository'
import type { AuthResult, AuthUser } from '@/core/types/auth'
import { getServerClient } from '@/infra/db/client'

export class SupabaseAuthRepository implements IAuthRepository {
  async signInWithPassword(email: string, password: string): Promise<AuthResult> {
    const supabase = await getServerClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      return { user: null, error: error.message }
    }
    const u = data.user
    return {
      user: u ? { id: u.id, email: u.email ?? '', createdAt: u.created_at } : null,
      error: null,
    }
  }

  async signUp(email: string, password: string): Promise<AuthResult> {
    const supabase = await getServerClient()
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      const msg = error.message.toLowerCase().includes('already') ? '该邮箱已被注册' : error.message
      return { user: null, error: msg }
    }
    const u = data.user
    return {
      user: u ? { id: u.id, email: u.email ?? '', createdAt: u.created_at } : null,
      error: null,
    }
  }

  async signOut(): Promise<void> {
    const supabase = await getServerClient()
    await supabase.auth.signOut()
  }

  async getSession(): Promise<AuthUser | null> {
    const supabase = await getServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null
    return { id: user.id, email: user.email ?? '', createdAt: user.created_at }
  }

  async signInWithOAuth(provider: 'github', nextPath = '/zh/dashboard'): Promise<{ url: string }> {
    const supabase = await getServerClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const safeNextPath = nextPath.startsWith('/') ? nextPath : '/zh/dashboard'
    const redirectTo = `${appUrl}/auth/callback?next=${encodeURIComponent(safeNextPath)}`
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
      },
    })
    if (error || !data.url) {
      throw new Error(error?.message ?? 'OAuth redirect URL unavailable')
    }
    return { url: data.url }
  }

  async updateDisplayName(name: string): Promise<AuthResult> {
    const supabase = await getServerClient()
    const { error } = await supabase.auth.updateUser({
      data: { display_name: name },
    })
    if (error) {
      return { user: null, error: error.message }
    }
    return { user: null, error: null }
  }

  async requestPasswordReset(email: string, redirectTo: string): Promise<void> {
    const supabase = await getServerClient()
    await supabase.auth.resetPasswordForEmail(email, { redirectTo })
  }

  async resetPassword(password: string): Promise<AuthResult> {
    const supabase = await getServerClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      return { user: null, error: error.message }
    }
    return { user: null, error: null }
  }

  async sendPasswordResetOTP(email: string): Promise<AuthResult> {
    const supabase = await getServerClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false, // Don't create user if not exists
      },
    })
    if (error) {
      return { user: null, error: error.message }
    }
    return { user: null, error: null }
  }

  async verifyPasswordResetOTP(
    email: string,
    token: string,
    newPassword: string,
  ): Promise<AuthResult> {
    const supabase = await getServerClient()
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })
    if (error) {
      return { user: null, error: error.message }
    }

    // After verifying OTP, update the password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })
    if (updateError) {
      return { user: null, error: updateError.message }
    }

    const u = data.user
    return {
      user: u ? { id: u.id, email: u.email ?? '', createdAt: u.created_at } : null,
      error: null,
    }
  }
}
