'use server'

import { redirect } from '@/i18n/navigation'
import { getAuthRepository } from '@/infra/providers'
import {
  signInSchema,
  signUpSchema,
  forgotPasswordSchema,
  resetPasswordWithOTPSchema,
  resetPasswordSchema,
  displayNameSchema,
} from '@/lib/validations/auth'
import type { ActionResult } from '@/core/types/auth'
import { defaultLocale, isLocale } from '@/i18n/config'
import type { SignUpSuccessData, OAuthData } from './__contract__'

function normalizeLocale(input: FormDataEntryValue | null): string {
  const locale = typeof input === 'string' ? input : defaultLocale
  return isLocale(locale) ? locale : defaultLocale
}

export async function signIn(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? '输入无效' }
  }

  const repo = getAuthRepository()
  const result = await repo.signInWithPassword(parsed.data.email, parsed.data.password)

  if (result.error) {
    return { data: null, error: result.error }
  }

  const locale = normalizeLocale(formData.get('locale'))
  return redirect({ href: '/dashboard', locale })
}

export async function signUp(
  _prevState: ActionResult<SignUpSuccessData> | null,
  formData: FormData,
): Promise<ActionResult<SignUpSuccessData>> {
  const parsed = signUpSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? '输入无效' }
  }

  const repo = getAuthRepository()
  const result = await repo.signUp(parsed.data.email, parsed.data.password)

  if (result.error) {
    return { data: null, error: result.error }
  }

  return { data: { success: true, email: parsed.data.email }, error: null }
}

export async function signOut(formData: FormData): Promise<void> {
  const repo = getAuthRepository()
  await repo.signOut()
  const locale = normalizeLocale(formData.get('locale'))
  return redirect({ href: '/login', locale })
}

export async function signInWithGithub(): Promise<ActionResult<OAuthData>> {
  return signInWithGithubForLocale(defaultLocale)
}

export async function signInWithGithubForLocale(
  localeInput: string,
): Promise<ActionResult<OAuthData>> {
  const repo = getAuthRepository()
  const locale = isLocale(localeInput) ? localeInput : defaultLocale
  try {
    const { url } = await repo.signInWithOAuth('github', `/${locale}/dashboard`)
    return { data: { url }, error: null }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'OAuth 初始化失败'
    return { data: null, error: msg }
  }
}

export async function requestPasswordReset(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult<void>> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get('email'),
  })

  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? '输入无效' }
  }

  const repo = getAuthRepository()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const locale = normalizeLocale(formData.get('locale'))
  const redirectTo = `${appUrl}/auth/callback?next=/${locale}/reset-password`

  // Always return success to prevent email enumeration
  await repo.requestPasswordReset(parsed.data.email, redirectTo)

  return { data: undefined as void, error: null }
}

export async function resetPassword(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult<void>> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? '输入无效' }
  }

  const repo = getAuthRepository()
  const result = await repo.resetPassword(parsed.data.password)

  if (result.error) {
    return { data: null, error: result.error }
  }

  const locale = normalizeLocale(formData.get('locale'))
  return redirect({ href: '/login', locale })
}

export async function updateDisplayName(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult<void>> {
  const parsed = displayNameSchema.safeParse({
    name: formData.get('name'),
  })

  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? '输入无效' }
  }

  const repo = getAuthRepository()
  const result = await repo.updateDisplayName(parsed.data.name)

  if (result.error) {
    return { data: null, error: result.error }
  }

  return { data: undefined as void, error: null }
}

export async function sendPasswordResetOTP(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult<void>> {
  const email = formData.get('email')
  if (!email || typeof email !== 'string') {
    return { data: null, error: '邮箱不能为空' }
  }

  const repo = getAuthRepository()
  const result = await repo.sendPasswordResetOTP(email)

  if (result.error) {
    return { data: null, error: result.error }
  }

  return { data: undefined as void, error: null }
}

export async function resetPasswordWithOTP(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult<void>> {
  const parsed = resetPasswordWithOTPSchema.safeParse({
    email: formData.get('email'),
    token: formData.get('token'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? '输入无效' }
  }

  const repo = getAuthRepository()
  const result = await repo.verifyPasswordResetOTP(
    parsed.data.email,
    parsed.data.token,
    parsed.data.password,
  )

  if (result.error) {
    return { data: null, error: result.error }
  }

  const locale = normalizeLocale(formData.get('locale'))
  return redirect({ href: '/login', locale })
}
