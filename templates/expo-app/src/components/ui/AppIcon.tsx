import { SymbolView } from 'expo-symbols'
import {
  ArrowUp,
  Bell,
  Check,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Globe,
  HardDrive,
  Info,
  Layers,
  LineChart,
  Menu,
  MessageCircle,
  Mic,
  Pause,
  Plus,
  Search,
  Shield,
  Sparkles,
  Square,
  User,
  ArrowLeftRight,
  X,
} from 'lucide-react-native'
import { Platform } from 'react-native'

export const APP_ICONS = {
  activity: 'clock.arrow.circlepath',
  agent: 'bubble.left.and.text.bubble.right.fill',
  back: 'chevron.left',
  chevronRight: 'chevron.right',
  chevronDown: 'chevron.down',
  chevronUp: 'chevron.up',
  check: 'checkmark.circle.fill',
  close: 'xmark',
  domain: 'globe',
  history: 'clock.arrow.circlepath',
  info: 'info.circle.fill',
  language: 'globe',
  layers: 'square.3.layers.3d',
  menu: 'line.3.horizontal',
  metrics: 'chart.xyaxis.line',
  mic: 'mic.fill',
  notifications: 'bell.fill',
  pause: 'pause.fill',
  plus: 'plus',
  privacy: 'hand.raised.fill',
  profile: 'person.crop.circle.fill',
  search: 'magnifyingglass',
  send: 'arrow.up',
  shield: 'checkmark.shield.fill',
  spark: 'sparkles',
  stop: 'stop.fill',
  storage: 'internaldrive.fill',
  sync: 'arrow.triangle.2.circlepath',
  user: 'person.crop.circle.fill',
} as const

export type AppIconName = keyof typeof APP_ICONS

const FALLBACK_ICONS = {
  activity: Clock,
  agent: MessageCircle,
  back: ChevronLeft,
  chevronRight: ChevronRight,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  check: Check,
  close: X,
  domain: Globe,
  history: Clock,
  info: Info,
  language: Globe,
  layers: Layers,
  menu: Menu,
  metrics: LineChart,
  mic: Mic,
  notifications: Bell,
  pause: Pause,
  plus: Plus,
  privacy: Shield,
  profile: User,
  search: Search,
  send: ArrowUp,
  shield: Shield,
  spark: Sparkles,
  stop: Square,
  storage: HardDrive,
  sync: ArrowLeftRight,
  user: User,
} as const

export function AppIcon({
  name,
  size = 20,
  color = '#1a1d23',
  weight = 'medium',
}: {
  name: AppIconName
  size?: number
  color?: string
  weight?: 'regular' | 'medium' | 'semibold' | 'bold'
}) {
  if (Platform.OS === 'ios') {
    return (
      <SymbolView
        name={APP_ICONS[name]}
        size={size}
        weight={weight}
        tintColor={color}
        resizeMode="scaleAspectFit"
        style={{ width: size, height: size }}
      />
    )
  }

  const FallbackIcon = FALLBACK_ICONS[name]
  return <FallbackIcon size={size} color={color} />
}
