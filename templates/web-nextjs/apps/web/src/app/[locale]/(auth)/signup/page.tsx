'use client'

import { useActionState, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { signUp } from '@/features/auth'
import { signUpSchema, type SignUpInput } from '@/lib/validations/auth'
import type { ActionResult } from '@/core/types/auth'
import type { SignUpSuccessData } from '@/features/auth/__contract__'

export default function SignupPage() {
  const t = useTranslations('auth')
  const routeParams = useParams<{ locale: string }>()
  const locale = routeParams.locale ?? 'en'
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null)

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  })

  const [state, formAction, isPending] = useActionState<ActionResult<SignUpSuccessData> | null, FormData>(
    signUp,
    null,
  )

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error)
    }
    if (state?.data?.success) {
      setVerifyEmail(state.data.email)
    }
  }, [state])

  if (verifyEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm space-y-4 text-center">
          <h1 className="text-2xl font-bold">{t('verifyEmailTitle')}</h1>
          <p className="text-muted-foreground">
            {t('verifyEmailMessage', { email: verifyEmail })}
          </p>
          <Link href={`/${locale}/login`} className="text-sm underline underline-offset-4">
            {t('signInLink')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">{t('signupTitle')}</h1>
          <p className="text-muted-foreground">{t('signupSubtitle')}</p>
        </div>

        <Form {...form}>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="locale" value={locale} />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('emailLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={t('emailPlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>{t('emailHelperText')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('passwordLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={t('passwordPlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('confirmPasswordLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={t('confirmPasswordPlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? '...' : t('signUpButton')}
            </Button>
          </form>
        </Form>

        <p className="text-center text-sm text-muted-foreground">
          {t('hasAccountText')}{' '}
          <Link
            href={`/${locale}/login`}
            className="underline underline-offset-4 hover:text-primary"
          >
            {t('signInLink')}
          </Link>
        </p>
      </div>
    </div>
  )
}
