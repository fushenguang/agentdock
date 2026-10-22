import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
  resolveActiveSession,
  runVerifiedAgentTurn,
  ACTIVE_SESSION_IDLE_TTL_MS,
  StructuredOutputTurnError,
  type AgentAuditEvent,
  type AgentContextEntry,
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
  readonly activeSessionId: string | undefined
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
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>(undefined)
  const activeSessionTitleRef = useRef('New voice session')
  const sessionClosedAtRef = useRef<number | undefined>(undefined)
  const sessionIdleTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const conversationEntriesRef = useRef<readonly AgentContextEntry[]>([])
  const [domainId, setDomainId] = useState('thefoolai')
  const dataStoreRef = useRef<Promise<MobileDataStore> | undefined>(undefined)
  const driver = useMemo(createConfiguredDriver, [])

  const clearSessionIdleTimer = useCallback(() => {
    if (!sessionIdleTimerRef.current) return
    clearTimeout(sessionIdleTimerRef.current)
    sessionIdleTimerRef.current = undefined
  }, [])

  useEffect(() => clearSessionIdleTimer, [clearSessionIdleTimer])

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

  const clearActiveSession = useCallback(() => {
    cancelActiveTurn()
    setActiveSessionId(undefined)
    activeSessionTitleRef.current = 'New voice session'
    conversationEntriesRef.current = []
    setResult(undefined)
    setStructuredOutputError(undefined)
    setStructuredOutputIssues([])
    setGenericError(undefined)
    setTurn(createInitialTurnState())
  }, [cancelActiveTurn])

  const openAgent = useCallback(() => {
    clearSessionIdleTimer()
    const resolved = resolveActiveSession({
      sessionId: activeSessionId,
      closedAt: sessionClosedAtRef.current,
    })
    sessionClosedAtRef.current = undefined

    if (!resolved.sessionId) {
      if (resolved.reason === 'idle-timeout') clearActiveSession()
      setActiveSessionId(newId())
      activeSessionTitleRef.current = 'New voice session'
      conversationEntriesRef.current = []
    }
    setSheetOpen(true)
  }, [activeSessionId, clearActiveSession, clearSessionIdleTimer])

  const closeAgent = useCallback(() => {
    setSheetOpen(false)
    if (!activeSessionId) return

    sessionClosedAtRef.current = Date.now()
    clearSessionIdleTimer()
    sessionIdleTimerRef.current = setTimeout(() => {
      sessionClosedAtRef.current = undefined
      clearSessionIdleTimer()
      clearActiveSession()
    }, ACTIVE_SESSION_IDLE_TTL_MS)
  }, [activeSessionId, clearActiveSession, clearSessionIdleTimer])

  const getDataStore = useCallback(() => {
    if (dataStoreRef.current) return dataStoreRef.current

    const dataStorePromise = getMobileDataStore()
    const retryablePromise = dataStorePromise.catch((error: unknown) => {
      if (dataStoreRef.current === retryablePromise) dataStoreRef.current = undefined
      throw error
    })
    dataStoreRef.current = retryablePromise
    return retryablePromise
  }, [])

  const recordAudit = useCallback(
    async (event: AgentAuditEvent) => {
      try {
        const store = await getDataStore()
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

  const startSession = useCallback(() => {
    cancelActiveTurn()
    clearSessionIdleTimer()
    sessionClosedAtRef.current = undefined
    const now = Date.now()
    setActiveSessionId(newId())
    activeSessionTitleRef.current = 'New voice session'
    conversationEntriesRef.current = []
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
    setSheetOpen(true)
  }, [cancelActiveTurn, clearSessionIdleTimer])

  const continueSession = useCallback(
    (sessionId: string, title = 'Continued session') => {
      cancelActiveTurn()
      clearSessionIdleTimer()
      sessionClosedAtRef.current = undefined
      setActiveSessionId(sessionId)
      activeSessionTitleRef.current = title
      conversationEntriesRef.current = []
      setResult(undefined)
      setStructuredOutputError(undefined)
      setStructuredOutputIssues([])
      setGenericError(undefined)
      setTurn(createInitialTurnState())
      setSheetOpen(true)
    },
    [cancelActiveTurn, clearSessionIdleTimer],
  )

  const dismissResult = useCallback(() => setResult(undefined), [])

  const submit = useCallback(
    async (text: string): Promise<boolean> => {
      if (activeTurnIdRef.current) return false

      let sessionId = activeSessionId
      if (!sessionId) {
        sessionId = newId()
        setActiveSessionId(sessionId)
      }
      const turnId = newId()
      if (activeSessionTitleRef.current === 'New voice session') {
        activeSessionTitleRef.current = text.length > 40 ? `${text.slice(0, 40)}…` : text
      }
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
          compactEntries: conversationEntriesRef.current,
          totalTokenEstimate: conversationEntriesRef.current.reduce(
            (total, entry) => total + entry.tokenEstimate,
            0,
          ),
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
        conversationEntriesRef.current = [
          ...conversationEntriesRef.current,
          { id: `user-${turnId}`, summary: text, tokenEstimate: Math.ceil(text.length / 4) },
          {
            id: `assistant-${turnId}`,
            summary:
              envelope.result.kind === 'text'
                ? envelope.result.text
                : `${envelope.title} (${envelope.result.kind})`,
            tokenEstimate: Math.ceil(
              (envelope.result.kind === 'text'
                ? envelope.result.text.length
                : envelope.title.length * 2) / 4,
            ),
          },
        ]
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
    [activeSessionId, domainId, driver, language, recordAudit],
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
      activeSessionId,
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
      activeSessionId,
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
