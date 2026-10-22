import type { TextInputProps } from 'react-native'
import { TextInput } from 'react-native'
import { cn } from '../../lib/utils'

export function Input({ className, ...props }: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor="#69746f"
      className={cn(
        'min-h-14 rounded-3xl border border-line bg-surfaceWarm px-4 text-base text-ink',
        className,
      )}
      {...props}
    />
  )
}
