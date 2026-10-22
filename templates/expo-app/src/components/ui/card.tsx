import type { ReactNode } from 'react'
import { View } from 'react-native'
import { cn } from '../../lib/utils'

export interface CardProps {
  children: ReactNode
  className?: string
  testID?: string
}

export function Card({ children, className, testID }: CardProps) {
  return (
    <View
      testID={testID}
      className={cn(
        'rounded-[30px] border border-white/70 bg-surfaceRaise/92 p-5 shadow-[0_16px_40px_rgba(26,29,35,0.07)]',
        className,
      )}
    >
      {children}
    </View>
  )
}
