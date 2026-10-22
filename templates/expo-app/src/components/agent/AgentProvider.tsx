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
  createConfiguredDriver,
  isActiveTurn,
  runVerifiedAgentTurn,
  StructuredOutputTurnError,
  type AgentAuditEvent,
  type AgentResultEnvelope,
  type StructuredOutputIssue,
  type AgentTurnState,
} from '../../core/agent'
import { getMobileDataStore, type MobileDataStore } from '../../infra/sqlite/dataStore'
import { newId } from '../../lib/id'
import { useLanguage } from '../settings/LanguageProvider'

export const AGENT_SHEET_HEIGHT_PERCENT = 80

export interface AgentSessionContextValue {
  readonly turn: AgentTurnState
  readonly sheetOpen: boolean
  readonly result: AgentResultEnvelope | undefined
  readonly structuredOutputError: string | undefined
  readonly structuredOutputIssues: readonly StructuredOutputIssue[]
  readonly genericError: string | undefined
  readonly driverId: string
  readonly domainId: string
  openAgent(): void
  closeAgent(): void
  startSession(): void
  continueSession(sessionId: string, title?: string): void
  dismissResult(): void
  submit(text: string): Promise<boolean>
  cancelTurn(): void
  setDomainId(domainId: string): void
}

const AgentSessionContext = createContext<AgentSessionContextValue | undefined>(undefined)

export function AgentSessionProvider({ children }: { children: ReactNode }) {
  const { language } = useLanguage()
  const [turn, setTurn] = useState<AgentTurnState>(createInitialTurnState)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [result, setResult] = useState<AgentResultEnvelope | undefined>(undefined)
  const [structuredOutputError, setStructuredOutputError] = useState<string | undefined>(undefined)
  const [structuredOutputIssues, setStructuredOutputIssues] = useState<
    readonly StructuredOutputIssue[]
  >([])
  const [genericError, setGenericError] = useState<string | undefined>(undefined)
  const cancelledTurnsRef = useRef(new Set<string>())
  const ensuredSessionsRef = useRef(new Set<string>())
  const activeTurnIdRef = useRef<string | undefined>(undefined)
  const activeSessionIdRef = useRef('local-current')
  const activeSessionTitleRef = useRef('New voice session')
  const [domainId, setDomainId] = useState('thefoolai')
  const dataStoreRef = useRef<MobileDataStore | undefined>(undefined)
  const driver = useMemo(createConfiguredDriver, [])

  const openAgent = useCallback(() => {
    if (activeSessionIdRef.current === 'local-current') activeSessionIdRef.current = newId()
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
            domainId,
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
    [domainId, getDataStore],
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
    setStructuredOutputIssues([])
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
    openAgent()
  }, [cancelActiveTurn, openAgent])

  const continueSession = useCallback(
    (sessionId: string, title = 'Continued session') => {
      cancelActiveTurn()
      activeSessionIdRef.current = sessionId
      activeSessionTitleRef.current = title
      setResult(undefined)
      setStructuredOutputError(undefined)
      setStructuredOutputIssues([])
      setGenericError(undefined)
      setTurn(createInitialTurnState())
      openAgent()
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
      setStructuredOutputIssues([])
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
      const request = {
        userText: text,
        context: {
          sessionId,
          domainId,
          locale: language,
          intentSummary: text,
          compactEntries: [] as const,
          totalTokenEstimate: 0,
        },
        isCancelled: () => cancelledTurnsRef.current.has(turnId),
      }

      try {
        const envelope = await runVerifiedAgentTurn({
          request,
          driver,
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
          setStructuredOutputIssues(error.failure.issues)
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
    [domainId, driver, language, recordAudit],
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
      result,
      structuredOutputError,
      structuredOutputIssues,
      genericError,
      driverId: driver.id,
      domainId,
      setDomainId,
      openAgent,
      closeAgent,
      startSession,
      continueSession,
      dismissResult,
      submit,
      cancelTurn,
    }),
    [
      turn,
      sheetOpen,
      result,
      structuredOutputError,
      structuredOutputIssues,
      genericError,
      driver,
      domainId,
      setDomainId,
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
