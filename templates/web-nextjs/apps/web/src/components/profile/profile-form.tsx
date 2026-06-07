'use client'

import { useActionState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { updateDisplayName } from '@/features/auth'
import { displayNameSchema, type DisplayNameInput } from '@/lib/validations/auth'
import type { ActionResult } from '@/core/types/auth'

interface ProfileFormProps {
  defaultName: string
  locale: string
}

export function ProfileForm({ defaultName, locale }: ProfileFormProps) {
  const {
    register,
    formState: { errors },
    reset,
  } = useForm<DisplayNameInput>({
    resolver: zodResolver(displayNameSchema),
    defaultValues: { name: defaultName },
  })

  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    updateDisplayName,
    null,
  )

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error)
    } else if (state?.data !== undefined && !state.error) {
      toast.success('Display name updated successfully')
    }
  }, [state])

  return (
    <form action={formAction}>
      <input type="hidden" name="locale" value={locale} />
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="name">Display Name</FieldLabel>
          <Input
            id="name"
            type="text"
            placeholder="Enter your display name"
            {...register('name')}
          />
          {errors.name && (
            <FieldDescription className="text-destructive">{errors.name.message}</FieldDescription>
          )}
        </Field>
        <Field>
          <Button type="submit" disabled={isPending}>
            {isPending ? '\u2026' : 'Save Changes'}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
