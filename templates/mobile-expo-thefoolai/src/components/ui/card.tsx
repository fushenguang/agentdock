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
    <View testID={testID} className={cn('rounded-3xl bg-surface p-5', className)}>
      {children}
    </View>
  )
}
