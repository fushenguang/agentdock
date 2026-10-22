import type { PressableProps } from 'react-native'
import { Pressable, Text as NativeText } from 'react-native'
import { cn } from '../../lib/utils'

const BUTTON_VARIANTS = {
  primary: 'rounded-full bg-accent px-6 py-3 active:bg-accentDark',
  secondary: 'rounded-full bg-accentSoft px-5 py-3 active:bg-lineWarm',
  ghost: 'rounded-full px-3 py-2 active:opacity-70',
  danger: 'bg-danger rounded-full px-5 py-3 active:opacity-80',
} as const

const BUTTON_TEXT_VARIANTS = {
  primary: 'text-base font-medium text-white',
  secondary: 'text-base font-medium text-ink',
  ghost: 'text-sm font-medium text-accentDark',
  danger: 'text-base font-medium text-white',
} as const

export type ButtonVariant = keyof typeof BUTTON_VARIANTS

export interface ButtonProps extends PressableProps {
  label: string
  variant?: ButtonVariant
  className?: string
}

export function Button({ label, variant = 'primary', className, ...props }: ButtonProps) {
  return (
    <Pressable className={cn(BUTTON_VARIANTS[variant], className)} {...props}>
      <NativeText className={BUTTON_TEXT_VARIANTS[variant]}>{label}</NativeText>
    </Pressable>
  )
}
