import { Mic } from 'lucide-react-native'
import { Pressable, Text } from 'react-native'
import { useAgentSession } from './AgentProvider'

export function AgentVoiceOrb({ hidden = false }: { hidden?: boolean }) {
  const { openAgent, turn } = useAgentSession()
  if (hidden) return null

  return (
    <Pressable
      testID="agent-voice-orb"
      accessibilityLabel="Open voice agent"
      className="absolute bottom-8 right-5 h-16 w-16 items-center justify-center rounded-full bg-accent shadow-lg"
      onPress={() => openAgent()}
    >
      <Mic size={24} color="#ffffff" />
      {turn.phase === 'idle' ? null : (
        <Text className="absolute bottom-1 text-[9px] font-medium text-white">agent</Text>
      )}
    </Pressable>
  )
}
