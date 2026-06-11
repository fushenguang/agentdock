'use client'

import { useActionState, useEffect, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { GalleryVerticalEnd } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { sendPasswordResetOTP, resetPasswordWithOTP } from '@/features/auth'
import { resetPasswordWithOTPSchema, type ResetPasswordWithOTPInput } from '@/lib/validations/auth'
import type { ActionResult } from '@/core/types/auth'

export default function ForgotPasswordPage() {
  const t = useTranslations('auth')
  const locale = useLocale()
  const [step, setStep] = useState<'send' | 'verify'>('send')
  const [email, setEmail] = useState('')
  const [countdown, setCountdown] = useState(0)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ResetPasswordWithOTPInput>({
    resolver: zodResolver(resetPasswordWithOTPSchema),
    defaultValues: { email: '', token: '', password: '', confirmPassword: '' },
  })

  const [sendState, sendAction, isSendPending] = useActionState<ActionResult | null, FormData>(
    sendPasswordResetOTP,
    null,
  )

  const [verifyState, verifyAction, isVerifyPending] = useActionState<
    ActionResult | null,
    FormData
  >(resetPasswordWithOTP, null)

  useEffect(() => {
    if (sendState?.error) {
      toast.error(sendState.error)
    } else if (sendState?.data !== undefined && sendState.error === null) {
      toast.success('验证码已发送，请检查邮箱')
      setStep('verify')
      startCountdown()
    }
  }, [sendState])

  useEffect(() => {
    if (verifyState?.error) {
      toast.error(verifyState.error)
    }
  }, [verifyState])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [countdown])

  function startCountdown() {
    setCountdown(60)
  }

  async function onSendOTP(data: { email: string }) {
    const formData = new FormData()
    formData.append('email', data.email)
    setEmail(data.email)
    setValue('email', data.email)
    sendAction(formData)
  }

  async function onResendOTP() {
    if (countdown > 0) return
    const formData = new FormData()
    formData.append('email', email)
    sendAction(formData)
  }

  async function onSubmit(data: ResetPasswordWithOTPInput) {
    const formData = new FormData()
    formData.append('email', data.email)
    formData.append('token', data.token)
    formData.append('password', data.password)
    formData.append('confirmPassword', data.confirmPassword)
    formData.append('locale', locale)
    verifyAction(formData)
  }

  if (step === 'send') {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <Link href="/" className="flex items-center gap-2 self-center font-medium">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GalleryVerticalEnd className="size-4" />
            </div>
            AgentDock
          </Link>

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">{t('forgotPasswordTitle')}</CardTitle>
              <CardDescription>{t('forgotPasswordSubtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSendOTP)}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="email">{t('emailLabel')}</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t('emailPlaceholder')}
                      autoComplete="email"
                      {...register('email')}
                    />
                    {errors.email && (
                      <FieldDescription className="text-destructive">
                        {errors.email.message}
                      </FieldDescription>
                    )}
                  </Field>
                  <Field>
                    <Button type="submit" className="w-full" disabled={isSendPending}>
                      {isSendPending ? '\u2026' : t('sendVerificationCode')}
                    </Button>
                    <FieldDescription className="text-center">
                      <Link href="/login" className="underline underline-offset-4">
                        {t('backToLogin')}
                      </Link>
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // step === 'verify'
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GalleryVerticalEnd className="size-4" />
          </div>
          AgentDock
        </Link>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">{t('resetPasswordTitle')}</CardTitle>
            <CardDescription>{t('resetPasswordSubtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)}>
              <input type="hidden" name="locale" value={locale} />
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">{t('emailLabel')}</FieldLabel>
                  <Input id="email" type="email" readOnly value={email} {...register('email')} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="token">{t('verificationCodeLabel')}</FieldLabel>
                  <Input
                    id="token"
                    type="text"
                    placeholder={t('verificationCodePlaceholder')}
                    maxLength={6}
                    {...register('token')}
                  />
                  {errors.token && (
                    <FieldDescription className="text-destructive">
                      {errors.token.message}
                    </FieldDescription>
                  )}
                  <FieldDescription className="mt-1">
                    {countdown > 0 ? (
                      <span className="text-muted-foreground">
                        {t('resendIn', { seconds: countdown })}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={onResendOTP}
                        className="text-sm text-primary hover:underline"
                      >
                        {t('resendCode')}
                      </button>
                    )}
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="password">{t('newPasswordLabel')}</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    placeholder={t('newPasswordPlaceholder')}
                    autoComplete="new-password"
                    {...register('password')}
                  />
                  {errors.password && (
                    <FieldDescription className="text-destructive">
                      {errors.password.message}
                    </FieldDescription>
                  )}
                </Field>
                <Field>
                  <FieldLabel htmlFor="confirmPassword">{t('confirmPasswordLabel')}</FieldLabel>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder={t('confirmPasswordPlaceholder')}
                    autoComplete="new-password"
                    {...register('confirmPassword')}
                  />
                  {errors.confirmPassword && (
                    <FieldDescription className="text-destructive">
                      {errors.confirmPassword.message}
                    </FieldDescription>
                  )}
                </Field>
                <Field>
                  <Button type="submit" className="w-full" disabled={isVerifyPending}>
                    {isVerifyPending ? '\u2026' : t('resetPassword')}
                  </Button>
                  <FieldDescription className="text-center">
                    <button
                      type="button"
                      onClick={() => setStep('send')}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      {t('changeEmail')}
                    </button>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
