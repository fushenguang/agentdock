import { Mic } from 'lucide-react-native'
import { Pressable } from 'react-native'
import { useLanguage } from '../settings/LanguageProvider'
import { useAgentSession } from './AgentProvider'

export function AgentVoiceOrb({ hidden = false }: { hidden?: boolean }) {
  const { openAgent } = useAgentSession()
  const { t } = useLanguage()
  if (hidden) return null

  return (
    <Pressable
      testID="agent-voice-orb"
      accessibilityLabel={t('agent.open')}
      className="absolute bottom-8 right-5 h-16 w-16 items-center justify-center rounded-full bg-accent shadow-lg"
      onPress={() => openAgent()}
    >
      <Mic size={24} color="#ffffff" />
    </Pressable>
  )
}
