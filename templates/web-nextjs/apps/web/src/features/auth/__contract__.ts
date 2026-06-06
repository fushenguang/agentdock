import type { ActionResult } from '@/core/types/auth'

export type SignInArgs = { email: string; password: string }
export type SignUpArgs = { email: string; password: string; confirmPassword: string }
export type SignUpSuccessData = { success: true; email: string }
export type OAuthData = { url: string }
export type RequestPasswordResetArgs = { email: string }
export type ResetPasswordArgs = { password: string; confirmPassword: string }
export type UpdateDisplayNameArgs = { name: string }

export interface AuthFeatureContract {
  signIn(args: SignInArgs): Promise<ActionResult>
  signUp(args: SignUpArgs): Promise<ActionResult<SignUpSuccessData>>
  signOut(): Promise<void>
  signInWithGithub(): Promise<ActionResult<OAuthData>>
  signInWithGithubForLocale(locale: string): Promise<ActionResult<OAuthData>>
  requestPasswordReset(args: RequestPasswordResetArgs): Promise<ActionResult>
  resetPassword(args: ResetPasswordArgs): Promise<ActionResult>
  updateDisplayName(args: UpdateDisplayNameArgs): Promise<ActionResult>
}
