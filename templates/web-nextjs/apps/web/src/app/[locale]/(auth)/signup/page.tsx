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
import { signUp } from '@/features/auth'
import { signUpSchema, type SignUpInput } from '@/lib/validations/auth'
import type { ActionResult } from '@/core/types/auth'
import type { SignUpSuccessData } from '@/features/auth/__contract__'

export default function SignupPage() {
  const t = useTranslations('auth')
  const locale = useLocale()
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null)

  const {
    register,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  })

  const [state, formAction, isPending] = useActionState<
    ActionResult<SignUpSuccessData> | null,
    FormData
  >(signUp, null)

  useEffect(() => {
    if (state?.error) toast.error(state.error)
    if (state?.data?.success) setVerifyEmail(state.data.email)
  }, [state])

  if (verifyEmail) {
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
              <CardTitle className="text-xl">{t('verifyEmailTitle')}</CardTitle>
              <CardDescription>{t('verifyEmailMessage', { email: verifyEmail })}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <Link href="/login" className="underline underline-offset-4 text-sm">
                  {t('signInLink')}
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GalleryVerticalEnd className="size-4" />
          </div>
          AgentDock
        </Link>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">{t('signupTitle')}</CardTitle>
              <CardDescription>{t('signupSubtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={formAction}>
                <input type="hidden" name="locale" value={locale} />
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
                    <FieldDescription>{t('emailHelperText')}</FieldDescription>
                  </Field>
                  <Field className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="password">{t('passwordLabel')}</FieldLabel>
                      <Input
                        id="password"
                        type="password"
                        placeholder={t('passwordPlaceholder')}
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
                  </Field>
                  <Field>
                    <Button type="submit" className="w-full" disabled={isPending}>
                      {isPending ? '\u2026' : t('signUpButton')}
                    </Button>
                    <FieldDescription className="text-center">
                      {t('hasAccountText')}{' '}
                      <Link href="/login" className="underline underline-offset-4">
                        {t('signInLink')}
                      </Link>
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
          <FieldDescription className="px-6 text-center">
            {t('termsText')}{' '}
            <Link href="/terms" className="underline underline-offset-4">
              {t('termsLink')}
            </Link>{' '}
            {t('andText')}{' '}
            <Link href="/privacy" className="underline underline-offset-4">
              {t('privacyLink')}
            </Link>
            .
          </FieldDescription>
        </div>
      </div>
    </div>
  )
}
