'use client'

import { useActionState, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { GalleryVerticalEnd } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { requestPasswordReset } from '@/features/auth'
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations/auth'
import type { ActionResult } from '@/core/types/auth'

export default function ForgotPasswordPage() {
  const t = useTranslations('auth')
  const routeParams = useParams<{ locale: string }>()
  const locale = routeParams.locale ?? 'en'
  const [isSent, setIsSent] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    requestPasswordReset,
    null,
  )

  useEffect(() => {
    if (state?.error) toast.error(state.error)
  }, [state])

  async function onSubmit(data: ForgotPasswordInput) {
    const formData = new FormData()
    formData.append('email', data.email)
    formData.append('locale', locale)
    await formAction(formData)
    setSubmittedEmail(data.email)
    setIsSent(true)
    reset()
  }

  if (isSent) {
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
              <CardTitle className="text-xl">{t('forgotPasswordTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-sm text-muted-foreground">
                {t('forgotPasswordSent', { email: submittedEmail })}
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/${locale}/login`}>{t('backToLogin')}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

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
            <CardTitle className="text-xl">{t('forgotPasswordTitle')}</CardTitle>
            <CardDescription>{t('forgotPasswordSubtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)}>
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
                </Field>
                <Field>
                  <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? '\u2026' : t('sendResetLink')}
                  </Button>
                  <FieldDescription className="text-center">
                    <Link href={`/${locale}/login`} className="underline underline-offset-4">
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
