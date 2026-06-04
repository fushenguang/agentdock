'use client'

import { useActionState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { GitBranch } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { signIn, signInWithGithubForLocale } from '@/features/auth'
import { signInSchema, type SignInInput } from '@/lib/validations/auth'
import type { ActionResult } from '@/core/types/auth'

export default function LoginPage() {
  const t = useTranslations('auth')
  const router = useRouter()
  const routeParams = useParams<{ locale: string }>()
  const locale = routeParams.locale ?? 'en'

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  })

  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    signIn,
    null,
  )

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error)
    }
  }, [state])

  async function handleGithub() {
    const result = await signInWithGithubForLocale(locale)
    if (result.error) {
      toast.error(result.error)
      return
    }
    if (result.data?.url) {
      router.push(result.data.url)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">{t('loginTitle')}</h1>
          <p className="text-muted-foreground">{t('loginSubtitle')}</p>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGithub}
        >
          <GitBranch className="mr-2 h-4 w-4" />
          {t('githubButton')}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">{t('orContinueWith')}</span>
          </div>
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

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? '...' : t('signInButton')}
            </Button>
          </form>
        </Form>

        <p className="text-center text-sm text-muted-foreground">
          {t('noAccountText')}{' '}
          <Link
            href={`/${locale}/signup`}
            className="underline underline-offset-4 hover:text-primary"
          >
            {t('signUpLink')}
          </Link>
        </p>
      </div>
    </div>
  )
}
