'use client'

import { useActionState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
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
import { resetPassword } from '@/features/auth'
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validations/auth'
import type { ActionResult } from '@/core/types/auth'

export default function ResetPasswordPage() {
  const t = useTranslations('auth')
  const searchParams = useSearchParams()
  const locale = useLocale()
  const error = searchParams.get('error')

  const {
    register,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    resetPassword,
    null,
  )

  useEffect(() => {
    if (state?.error) toast.error(state.error)
  }, [state])

  useEffect(() => {
    if (error === 'link_expired') {
      toast.error(t('resetLinkExpired'))
    }
  }, [error, t])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href={`/${locale}`} className="flex items-center gap-2 self-center font-medium">
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
            <form action={formAction}>
              <input type="hidden" name="locale" value={locale} />
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="password">{t('newPasswordLabel')}</FieldLabel>
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
                <Field>
                  <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? '\u2026' : t('resetPasswordButton')}
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
