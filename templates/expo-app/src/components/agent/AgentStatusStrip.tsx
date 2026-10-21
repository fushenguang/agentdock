import { useEffect, useState } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import { executionStatus, isActiveTurn, type AgentTurnState } from '../../core/agent'

const STATE_COLORS = {
  active: 'bg-accent/10 text-accent',
  completed: 'bg-success/10 text-success',
  failed: 'bg-danger/10 text-danger',
  idle: 'bg-line text-muted',
} as const

function stateKey(turn: AgentTurnState): keyof typeof STATE_COLORS {
  if (turn.phase === 'completed') return 'completed'
  if (turn.phase === 'failed') return 'failed'
  if (isActiveTurn(turn)) return 'active'
  return 'idle'
}

export function AgentStatusStrip({ turn }: { turn: AgentTurnState }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!isActiveTurn(turn)) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [turn])

  const status = executionStatus(turn, now)
  return (
    <View
      testID="agent-status"
      className="flex-row items-center gap-2 rounded-2xl bg-canvas px-4 py-3"
    >
      {isActiveTurn(turn) ? <ActivityIndicator size="small" color="#4f7c5b" /> : null}
      <Text className={`flex-1 text-sm font-medium ${STATE_COLORS[stateKey(turn)]}`}>
        {status.label}
      </Text>
      <Text className="text-xs text-muted">{turn.steps.length} events</Text>
    </View>
  )
}
