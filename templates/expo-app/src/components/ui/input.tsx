import type { TextInputProps } from 'react-native'
import { TextInput } from 'react-native'
import { cn } from '../../lib/utils'

export function Input({ className, ...props }: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor="#69746f"
      className={cn(
        'min-h-12 rounded-2xl border border-line bg-surface px-4 text-base text-ink',
        className,
      )}
      {...props}
    />
  )
}
