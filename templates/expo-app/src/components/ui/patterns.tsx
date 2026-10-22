import { LinearGradient } from 'expo-linear-gradient'
import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import type { PressableProps } from 'react-native'
import { AppIcon, type AppIconName } from './AppIcon'
import { Text } from './text'

const TONES = {
  amber: { from: '#f7c677', to: '#c97b1b', copy: '#ffffff', soft: '#fbf1e3' },
  violet: { from: '#c4b5fd', to: '#7c3aed', copy: '#ffffff', soft: '#f1ebff' },
  sky: { from: '#93c5fd', to: '#2563eb', copy: '#ffffff', soft: '#eaf2ff' },
  green: { from: '#86efac', to: '#15803d', copy: '#ffffff', soft: '#eaf7ef' },
  neutral: { from: '#e5e7eb', to: '#6b7280', copy: '#ffffff', soft: '#f3f4f6' },
} as const

export type IconTone = keyof typeof TONES

export function IconBadge({
  icon,
  tone = 'amber',
  size = 48,
}: {
  icon: AppIconName
  tone?: IconTone
  size?: number
}) {
  const colors = TONES[tone]
  return (
    <LinearGradient
      colors={[colors.from, colors.to]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AppIcon name={icon} size={Math.round(size * 0.48)} color={colors.copy} />
    </LinearGradient>
  )
}

export function StatusPill({ label, tone = 'neutral' }: { label: string; tone?: IconTone }) {
  const colors = TONES[tone]
  return (
    <View className="self-start rounded-full px-3 py-1.5" style={{ backgroundColor: colors.soft }}>
      <Text className="text-[11px] font-semibold" style={{ color: colors.to }}>
        {label}
      </Text>
    </View>
  )
}

export interface ActionTileProps extends PressableProps {
  icon: AppIconName
  title: string
  detail: string
  tone?: IconTone
  testID?: string
  className?: string
}

export function ActionTile({
  icon,
  title,
  detail,
  tone = 'amber',
  testID,
  className,
  ...props
}: ActionTileProps) {
  return (
    <Pressable
      testID={testID}
      className={`flex-1 gap-3 rounded-[28px] border border-white/70 bg-white/72 p-4 active:opacity-80 ${className ?? ''}`}
      {...props}
    >
      <IconBadge icon={icon} tone={tone} size={44} />
      <View className="gap-1">
        <Text className="text-base font-semibold text-ink">{title}</Text>
        <Text className="text-xs leading-4 text-muted">{detail}</Text>
      </View>
    </Pressable>
  )
}

export interface SettingRowProps extends PressableProps {
  icon: AppIconName
  title: string
  detail?: string
  value?: string
  tone?: IconTone
  children?: ReactNode
}

export function SettingRow({
  icon,
  title,
  detail,
  value,
  tone = 'amber',
  children,
  ...props
}: SettingRowProps) {
  return (
    <Pressable
      className="min-h-[68px] flex-row items-center gap-3 rounded-3xl bg-white/70 px-4 py-3 active:bg-white"
      {...props}
    >
      <IconBadge icon={icon} tone={tone} size={40} />
      <View className="flex-1 gap-0.5">
        <Text className="text-base font-semibold text-ink">{title}</Text>
        {detail ? <Text className="text-xs leading-4 text-muted">{detail}</Text> : null}
      </View>
      {value ? <Text className="text-sm font-medium text-accentDark">{value}</Text> : null}
      {children}
    </Pressable>
  )
}

export function DetailCard({
  icon,
  title,
  body,
  tone = 'neutral',
}: {
  icon: AppIconName
  title: string
  body: string
  tone?: IconTone
}) {
  return (
    <View className="gap-3 rounded-[28px] border border-white/70 bg-white/74 p-5">
      <IconBadge icon={icon} tone={tone} size={42} />
      <View className="gap-2">
        <Text className="text-base font-semibold text-ink">{title}</Text>
        <Text className="text-sm leading-5 text-muted">{body}</Text>
      </View>
    </View>
  )
}
