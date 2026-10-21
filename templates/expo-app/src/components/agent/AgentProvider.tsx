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
  AGENT_PHASES,
  AgentTurnCancelledError,
  createInitialTurnState,
  createReferenceDriver,
  isActiveTurn,
  runVerifiedAgentTurn,
  StructuredOutputTurnError,
  type AgentAuditEvent,
  type AgentResultEnvelope,
  type AgentTurnDriver,
  type AgentTurnState,
} from '../../core/agent'
import { getMobileDataStore, type MobileDataStore } from '../../infra/sqlite/dataStore'
import { newId } from '../../lib/id'

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
  readonly genericError: string | undefined
  openAgent(snap?: AgentSheetSnap): void
  closeAgent(): void
  setSnapPoint(snap: AgentSheetSnap): void
  startSession(): void
  continueSession(sessionId: string): void
  dismissResult(): void
  submit(text: string): Promise<boolean>
  cancelTurn(): void
}

const AgentSessionContext = createContext<AgentSessionContextValue | undefined>(undefined)

export function AgentSessionProvider({ children }: { children: ReactNode }) {
  const [turn, setTurn] = useState<AgentTurnState>(createInitialTurnState)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [snapPoint, setSnapPoint] = useState<AgentSheetSnap>(AGENT_SHEET_SNAP_POINTS.voice)
  const [result, setResult] = useState<AgentResultEnvelope | undefined>(undefined)
  const [structuredOutputError, setStructuredOutputError] = useState<string | undefined>(undefined)
  const [genericError, setGenericError] = useState<string | undefined>(undefined)
  const cancelledTurnsRef = useRef(new Set<string>())
  const ensuredSessionsRef = useRef(new Set<string>())
  const activeTurnIdRef = useRef<string | undefined>(undefined)
  const activeSessionIdRef = useRef('local-current')
  const activeSessionTitleRef = useRef('New voice session')
  const dataStoreRef = useRef<MobileDataStore | undefined>(undefined)
  const driverRef = useRef<AgentTurnDriver>(createReferenceDriver())

  const openAgent = useCallback((snap = AGENT_SHEET_SNAP_POINTS.voice) => {
    if (activeSessionIdRef.current === 'local-current') activeSessionIdRef.current = newId()
    setSnapPoint(snap)
    setSheetOpen(true)
  }, [])

  const closeAgent = useCallback(() => setSheetOpen(false), [])

  const getDataStore = useCallback(() => {
    dataStoreRef.current ??= getMobileDataStore()
    return dataStoreRef.current
  }, [])

  const recordAudit = useCallback(
    async (event: AgentAuditEvent) => {
      try {
        const store = getDataStore()
        if (!ensuredSessionsRef.current.has(event.sessionId)) {
          await store.sessions.ensure({
            id: event.sessionId,
            domainId: 'thefoolai',
            title: activeSessionTitleRef.current,
            status: 'active',
          })
          ensuredSessionsRef.current.add(event.sessionId)
        }
        await store.events.appendAudit(event)
        await store.sessions.touch(event.sessionId)
      } catch (error) {
        console.warn('Agent audit persistence failed', error)
      }
    },
    [getDataStore],
  )

  const cancelActiveTurn = useCallback(() => {
    const activeTurnId = activeTurnIdRef.current
    if (!activeTurnId) return
    cancelledTurnsRef.current.add(activeTurnId)
    activeTurnIdRef.current = undefined
    setTurn((current) => ({
      ...current,
      phase: AGENT_PHASES.cancelled,
      stage: 'Cancelled',
      updatedAt: Date.now(),
    }))
  }, [])

  const startSession = useCallback(() => {
    cancelActiveTurn()
    const now = Date.now()
    activeSessionIdRef.current = newId()
    activeSessionTitleRef.current = 'New voice session'
    setResult(undefined)
    setStructuredOutputError(undefined)
    setGenericError(undefined)
    setTurn({
      turnId: newId(),
      phase: AGENT_PHASES.listening,
      stage: 'Listening',
      startedAt: now,
      updatedAt: now,
      steps: [],
      result: undefined,
      failureCode: undefined,
      failureMessage: undefined,
    })
    openAgent(AGENT_SHEET_SNAP_POINTS.voice)
  }, [cancelActiveTurn, openAgent])

  const continueSession = useCallback(
    (sessionId: string) => {
      cancelActiveTurn()
      activeSessionIdRef.current = sessionId
      setResult(undefined)
      setStructuredOutputError(undefined)
      setGenericError(undefined)
      setTurn(createInitialTurnState())
      openAgent(AGENT_SHEET_SNAP_POINTS.voice)
    },
    [cancelActiveTurn, openAgent],
  )

  const dismissResult = useCallback(() => setResult(undefined), [])

  const submit = useCallback(
    async (text: string): Promise<boolean> => {
      if (activeTurnIdRef.current) return false

      const turnId = newId()
      const sessionId = activeSessionIdRef.current
      activeSessionTitleRef.current = text.length > 40 ? `${text.slice(0, 40)}…` : text
      const startedAt = Date.now()
      activeTurnIdRef.current = turnId
      setResult(undefined)
      setStructuredOutputError(undefined)
      setGenericError(undefined)
      setTurn({
        turnId,
        phase: AGENT_PHASES.planning,
        stage: 'Preparing turn',
        startedAt,
        updatedAt: startedAt,
        steps: [],
        result: undefined,
        failureCode: undefined,
        failureMessage: undefined,
      })
      setSnapPoint(AGENT_SHEET_SNAP_POINTS.task)

      const request = {
        userText: text,
        context: {
          sessionId,
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
          recordAudit,
          turnId,
          observe: (step) => {
            setTurn((current) =>
              current.turnId !== turnId
                ? current
                : {
                    ...current,
                    phase:
                      step.kind === 'tool' ? AGENT_PHASES.runningTool : AGENT_PHASES.structuring,
                    stage: step.label,
                    updatedAt: Date.now(),
                    steps: [...current.steps, step],
                  },
            )
          },
        })

        if (cancelledTurnsRef.current.has(turnId)) return false
        activeTurnIdRef.current = undefined
        setResult(envelope)
        setTurn((current) => ({
          ...current,
          phase: AGENT_PHASES.completed,
          stage: 'Result ready',
          result: envelope,
          updatedAt: Date.now(),
        }))
        setSnapPoint(AGENT_SHEET_SNAP_POINTS.full)
        return true
      } catch (error) {
        if (cancelledTurnsRef.current.has(turnId)) return false
        if (error instanceof AgentTurnCancelledError) {
          if (activeTurnIdRef.current === turnId) activeTurnIdRef.current = undefined
          setTurn((current) => ({
            ...current,
            phase: AGENT_PHASES.cancelled,
            stage: 'Cancelled',
            updatedAt: Date.now(),
          }))
          return false
        }

        activeTurnIdRef.current = undefined
        if (error instanceof StructuredOutputTurnError) {
          setStructuredOutputError(`${error.failure.code}: ${error.failure.message}`)
          setTurn((current) => ({
            ...current,
            phase: AGENT_PHASES.failed,
            stage: 'Structured output failed',
            failureCode: error.failure.code,
            failureMessage: error.failure.message,
            updatedAt: Date.now(),
          }))
          return false
        }

        const message = error instanceof Error ? error.message : 'Agent turn failed.'
        setGenericError(message)
        setTurn((current) => ({
          ...current,
          phase: AGENT_PHASES.failed,
          stage: 'Agent turn failed',
          failureCode: 'agent_turn_failed',
          failureMessage: message,
          updatedAt: Date.now(),
        }))
        return false
      }
    },
    [recordAudit],
  )

  const cancelTurn = useCallback(() => {
    if (!activeTurnIdRef.current && !isActiveTurn(turn)) return
    const turnId = activeTurnIdRef.current ?? turn.turnId
    if (!turnId) return
    cancelledTurnsRef.current.add(turnId)
    activeTurnIdRef.current = undefined
    setTurn((current) => ({
      ...current,
      phase: AGENT_PHASES.cancelled,
      stage: 'Cancelled',
      updatedAt: Date.now(),
    }))
  }, [turn])

  const value = useMemo<AgentSessionContextValue>(
    () => ({
      turn,
      sheetOpen,
      snapPoint,
      result,
      structuredOutputError,
      genericError,
      openAgent,
      closeAgent,
      setSnapPoint,
      startSession,
      continueSession,
      dismissResult,
      submit,
      cancelTurn,
    }),
    [
      turn,
      sheetOpen,
      snapPoint,
      result,
      structuredOutputError,
      genericError,
      openAgent,
      closeAgent,
      startSession,
      continueSession,
      dismissResult,
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
