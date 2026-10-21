import type { TextProps as NativeTextProps } from 'react-native'
import { Text as NativeText } from 'react-native'
import { cn } from '../../lib/utils'

const TEXT_VARIANTS = {
  display: 'text-3xl font-semibold text-ink',
  title: 'text-xl font-semibold text-ink',
  body: 'text-base text-ink',
  muted: 'text-sm text-muted',
  caption: 'text-xs text-muted',
} as const

export type TextVariant = keyof typeof TEXT_VARIANTS

export interface TextProps extends NativeTextProps {
  variant?: TextVariant
  className?: string
}

export function Text({ children, variant = 'body', className, ...props }: TextProps) {
  return (
    <NativeText className={cn(TEXT_VARIANTS[variant], className)} {...props}>
      {children}
    </NativeText>
  )
}
