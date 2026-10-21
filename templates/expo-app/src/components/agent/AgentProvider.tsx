import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  createInitialTurnState,
  createReferenceDriver,
  runVerifiedAgentTurn,
  StructuredOutputTurnError,
  AgentTurnCancelledError,
  AGENT_PHASES,
  type AgentResultEnvelope,
  type AgentTurnDriver,
  type AgentTurnState,
} from '../../core/agent'

export const AGENT_SHEET_SNAP_POINTS = {
  voice: 25,
  task: 50,
  full: 90,
} as const

export type AgentSheetSnap = (typeof AGENT_SHEET_SNAP_POINTS)[keyof typeof AGENT_SHEET_SNAP_POINTS]

export interface AgentSessionContextValue {
  readonly turn: AgentTurnState
  readonly sheetOpen: boolean
  readonly snapPoint: AgentSheetSnap
  readonly result: AgentResultEnvelope | undefined
  readonly structuredOutputError: string | undefined
  openAgent(snap?: AgentSheetSnap): void
  closeAgent(): void
  setSnapPoint(snap: AgentSheetSnap): void
  startSession(): void
  submit(text: string): Promise<void>
  cancelTurn(): void
}

const AgentSessionContext = createContext<AgentSessionContextValue | undefined>(undefined)

export function AgentSessionProvider({ children }: { children: ReactNode }) {
  const [turn, setTurn] = useState(createInitialTurnState)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [snapPoint, setSnapPoint] = useState<AgentSheetSnap>(AGENT_SHEET_SNAP_POINTS.voice)
  const [result, setResult] = useState<AgentResultEnvelope>()
  const [structuredOutputError, setStructuredOutputError] = useState<string>()
  const cancelledTurnsRef = useRef(new Set<string>())
  const driverRef = useRef<AgentTurnDriver>(createReferenceDriver())

  const openAgent = useCallback((snap = AGENT_SHEET_SNAP_POINTS.voice) => {
    setSnapPoint(snap)
    setSheetOpen(true)
  }, [])

  const closeAgent = useCallback(() => setSheetOpen(false), [])

  const startSession = useCallback(() => {
    const now = Date.now()
    setResult(undefined)
    setStructuredOutputError(undefined)
    setTurn({
      turnId: crypto.randomUUID(),
      phase: 'listening',
      stage: 'Listening',
      startedAt: now,
      updatedAt: now,
      steps: [],
    })
    openAgent(AGENT_SHEET_SNAP_POINTS.voice)
  }, [openAgent])

  const submit = useCallback(async (text: string) => {
    const turnId = crypto.randomUUID()
    const startedAt = Date.now()
    setResult(undefined)
    setStructuredOutputError(undefined)
    setTurn({
      turnId,
      phase: 'planning',
      stage: 'Preparing turn',
      startedAt,
      updatedAt: startedAt,
      steps: [],
    })
    setSnapPoint(AGENT_SHEET_SNAP_POINTS.task)

    const request = {
      sessionId: 'local-current',
      domainId: 'thefoolai',
      userText: text,
      context: {
        sessionId: 'local-current',
        domainId: 'thefoolai',
        intentSummary: text,
        compactEntries: [] as const,
        totalTokenEstimate: 0,
      },
      isCancelled: () => cancelledTurnsRef.current.has(turnId),
    }

    try {
      const envelope = await runVerifiedAgentTurn({
        request,
        driver: driverRef.current,
        recordAudit: async () => undefined,
        observe: (step) => {
          setTurn((current) => ({
            ...current,
            phase: step.kind === 'tool' ? AGENT_PHASES.runningTool : AGENT_PHASES.structuring,
            stage: step.label,
            updatedAt: Date.now(),
            steps: [...current.steps, step],
          }))
        },
      })
      if (cancelledTurnsRef.current.has(turnId)) return
      setResult(envelope)
      setTurn((current) => ({
        ...current,
        phase: 'completed',
        stage: 'Result ready',
        updatedAt: Date.now(),
      }))
      setSnapPoint(AGENT_SHEET_SNAP_POINTS.full)
    } catch (error) {
      if (cancelledTurnsRef.current.has(turnId)) return
      if (error instanceof AgentTurnCancelledError) return
      if (!(error instanceof StructuredOutputTurnError)) throw error
      setStructuredOutputError(`${error.failure.code}: ${error.failure.message}`)
      setTurn((current) => ({
        ...current,
        phase: 'failed',
        stage: 'Structured output failed',
        failureCode: error.failure.code,
        failureMessage: error.failure.message,
        updatedAt: Date.now(),
      }))
    }
  }, [])

  const cancelTurn = useCallback(() => {
    setTurn((current) => {
      if (current.turnId) cancelledTurnsRef.current.add(current.turnId)
      return {
        ...current,
        phase: 'cancelled',
        stage: 'Cancelled',
        updatedAt: Date.now(),
      }
    })
  }, [])

  const value = useMemo<AgentSessionContextValue>(
    () => ({
      turn,
      sheetOpen,
      snapPoint,
      result,
      structuredOutputError,
      openAgent,
      closeAgent,
      setSnapPoint,
      startSession,
      submit,
      cancelTurn,
    }),
    [
      turn,
      sheetOpen,
      snapPoint,
      result,
      structuredOutputError,
      openAgent,
      closeAgent,
      startSession,
      submit,
      cancelTurn,
    ],
  )

  return <AgentSessionContext.Provider value={value}>{children}</AgentSessionContext.Provider>
}

export function useAgentSession(): AgentSessionContextValue {
  const context = useContext(AgentSessionContext)
  if (!context) throw new Error('useAgentSession must be used inside AgentSessionProvider')
  return context
}
