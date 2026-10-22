import { BlurView } from 'expo-blur'
import type { ReactNode } from 'react'
import { Platform, View } from 'react-native'

export function GlassCard({
  children,
  className = '',
  testID,
  intensity = 58,
}: {
  children: ReactNode
  className?: string
  testID?: string
  intensity?: number
}) {
  const isIOS = Platform.OS === 'ios'

  return (
    <View
      testID={testID}
      className={`overflow-hidden rounded-[30px] border border-white/60 bg-white/58 shadow-[0_18px_50px_rgba(26,29,35,0.09)] ${className}`}
      style={{
        borderWidth: Platform.select({ ios: 0.75, android: 1 }),
        borderColor: 'rgba(255,255,255,0.72)',
      }}
    >
      {isIOS ? (
        <BlurView
          intensity={intensity}
          tint="systemUltraThinMaterialLight"
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
        />
      ) : null}
      <View className="relative">{children}</View>
    </View>
  )
}
