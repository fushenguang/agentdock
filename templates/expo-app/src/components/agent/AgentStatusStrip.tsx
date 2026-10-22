import { useEffect, useState } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import {
  AGENT_PHASES,
  completedStepCount,
  formatElapsed,
  isExecutingTurn,
  isActiveTurn,
  type AgentTurnState,
} from '../../core/agent'
import { useLanguage } from '../settings/LanguageProvider'

const STATE_COLORS = {
  active: 'bg-accent/10 text-accent',
  completed: 'bg-success/10 text-success',
  failed: 'bg-danger/10 text-danger',
  idle: 'bg-line text-muted',
} as const

function stateKey(turn: AgentTurnState): keyof typeof STATE_COLORS {
  if (turn.phase === 'completed') return 'completed'
  if (turn.phase === 'failed') return 'failed'
  if (isExecutingTurn(turn)) return 'active'
  return 'idle'
}

export function AgentStatusStrip({ turn }: { turn: AgentTurnState }) {
  const { t } = useLanguage()
  const [now, setNow] = useState(() => Date.now())
  const active = isExecutingTurn(turn)

  useEffect(() => {
    if (!active) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [active])

  const phaseLabel =
    turn.phase === AGENT_PHASES.listening
      ? t('agent.listeningStatus')
      : turn.phase === AGENT_PHASES.planning
        ? t('agent.preparingTurn')
        : turn.phase === AGENT_PHASES.waitingPermission
          ? t('agent.waitingPermission')
          : turn.phase === AGENT_PHASES.runningTool
            ? t('agent.runningTool')
            : turn.phase === AGENT_PHASES.structuring
              ? t('agent.structuring')
              : turn.phase === AGENT_PHASES.completed
                ? t('agent.resultReady')
                : turn.phase === AGENT_PHASES.failed
                  ? t('agent.turnFailedStatus')
                  : turn.phase === AGENT_PHASES.cancelled
                    ? t('agent.cancelled')
                    : t('agent.ready')
  const elapsedSeconds = Math.max(0, Math.floor((now - turn.startedAt) / 1000))
  const showElapsed = isActiveTurn(turn) && elapsedSeconds >= 10
  const stepCount = completedStepCount(turn)
  const stepLabel =
    stepCount === 1 ? t('agent.oneStep') : t('agent.manySteps', { value: stepCount })
  const label =
    isActiveTurn(turn) && elapsedSeconds < 3
      ? t('agent.working')
      : showElapsed
        ? `${phaseLabel} · ${formatElapsed(turn.startedAt, now)} · ${stepLabel}`
        : phaseLabel

  return (
    <View
      testID="agent-status"
      className="flex-row items-center gap-2 rounded-2xl bg-canvas px-4 py-3"
    >
      {isExecutingTurn(turn) ? <ActivityIndicator size="small" color="#4f7c5b" /> : null}
      <Text className={`flex-1 text-sm font-medium ${STATE_COLORS[stateKey(turn)]}`}>{label}</Text>
      <Text className="text-xs text-muted">{t('agent.events', { value: turn.steps.length })}</Text>
    </View>
  )
}
