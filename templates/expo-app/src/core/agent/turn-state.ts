import type { AgentResultEnvelope } from './agent-result'
import { AGENT_PHASES, isTerminalAgentPhase, type AgentPhase, type AgentTurnStep } from './types'

export interface AgentTurnState {
  readonly turnId: string
  readonly phase: AgentPhase
  readonly stage: string
  readonly startedAt: number
  readonly updatedAt: number
  readonly steps: readonly AgentTurnStep[]
  readonly result: AgentResultEnvelope | undefined
  readonly failureCode: string | undefined
  readonly failureMessage: string | undefined
}

export function createInitialTurnState(now = Date.now()): AgentTurnState {
  return {
    turnId: '',
    phase: 'idle',
    stage: 'Ready',
    startedAt: now,
    updatedAt: now,
    steps: [],
    result: undefined,
    failureCode: undefined,
    failureMessage: undefined,
  }
}

export function isActiveTurn(state: AgentTurnState): boolean {
  return !isTerminalAgentPhase(state.phase)
}

const EXECUTING_TURN_PHASES: readonly AgentPhase[] = [
  AGENT_PHASES.planning,
  AGENT_PHASES.waitingPermission,
  AGENT_PHASES.runningTool,
  AGENT_PHASES.structuring,
]

export function isExecutingTurn(state: AgentTurnState): boolean {
  return EXECUTING_TURN_PHASES.includes(state.phase)
}

export function completedStepCount(state: AgentTurnState): number {
  return state.steps.filter((step) => step.status === 'succeeded').length
}

export function formatElapsed(startedAt: number, now = Date.now()): string {
  const seconds = Math.max(0, Math.floor((now - startedAt) / 1000))
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  return `${minutes}m ${seconds % 60}s`
}

export interface ExecutionStatusPresentation {
  readonly showStage: boolean
  readonly showElapsed: boolean
  readonly label: string
}

export function executionStatus(
  state: AgentTurnState,
  now = Date.now(),
): ExecutionStatusPresentation {
  if (!isActiveTurn(state)) {
    return { showStage: false, showElapsed: false, label: state.stage }
  }

  const elapsedSeconds = Math.max(0, Math.floor((now - state.startedAt) / 1000))
  const showStage = elapsedSeconds >= 3
  const showElapsed = elapsedSeconds >= 10
  const stepCount = completedStepCount(state)
  const stepLabel = stepCount === 1 ? '1 step' : `${stepCount} steps`
  const suffix = showElapsed ? ` · ${formatElapsed(state.startedAt, now)} · ${stepLabel}` : ''
  return {
    showStage,
    showElapsed,
    label: `${showStage ? state.stage : 'Working…'}${suffix}`,
  }
}
