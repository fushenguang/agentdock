import { LinearGradient } from 'expo-linear-gradient'
import { ActivityIndicator, Pressable, View } from 'react-native'
import { isExecutingTurn } from '../../core/agent'
import { tapFeedback } from '../../lib/haptics'
import { useLanguage } from '../settings/LanguageProvider'
import { AppIcon } from '../ui'
import { useAgentSession } from './AgentProvider'

export function AgentVoiceOrb({ hidden = false }: { hidden?: boolean }) {
  const { openAgent, turn } = useAgentSession()
  const { t } = useLanguage()
  if (hidden) return null

  return (
    <Pressable
      testID="agent-voice-orb"
      accessibilityLabel={t('agent.open')}
      className="absolute bottom-8 right-5 h-[68px] w-[68px] items-center justify-center"
      onPress={() => {
        tapFeedback()
        openAgent()
      }}
    >
      <LinearGradient
        colors={['#f7c677', '#d98d2d', '#8b5cf6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          position: 'absolute',
          top: 3,
          bottom: 3,
          left: 3,
          right: 3,
          borderRadius: 34,
        }}
      />
      <View
        className="absolute h-[68px] w-[68px] rounded-[34px] border border-white/50"
        style={{ boxShadow: '0 18px 38px rgba(217,141,45,0.32)' }}
      />
      {isExecutingTurn(turn) ? (
        <ActivityIndicator size="small" color="#ffffff" />
      ) : (
        <AppIcon name="mic" size={26} color="#ffffff" weight="semibold" />
      )}
    </Pressable>
  )
}
