import type { ReactNode } from 'react'
import { View } from 'react-native'
import { Text } from './text'

export interface SectionProps {
  title: string
  action?: ReactNode
  children: ReactNode
}

export function Section({ title, action, children }: SectionProps) {
  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text variant="caption">{title}</Text>
        {action}
      </View>
      {children}
    </View>
  )
}
