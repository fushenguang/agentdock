import type { AgentResultEnvelope } from './agent-result'
import { runStructuredOutputGate, type StructuredOutputResult } from './structured-output-gate'
import {
  AgentTurnCancelledError,
  type AgentAuditEvent,
  type AgentTurnDriver,
  type AgentTurnRequest,
  type AgentTurnStep,
} from './types'
import { newId } from '../../lib/id'

export class StructuredOutputTurnError extends Error {
  constructor(readonly failure: Extract<StructuredOutputResult, { ok: false }>) {
    super(failure.message)
    this.name = 'StructuredOutputTurnError'
  }
}

function audit(
  sessionId: string,
  turnId: string,
  type: 'turn-started' | 'output-validated' | 'output-rejected' | 'turn-finished',
  payload: Record<string, unknown>,
): AgentAuditEvent {
  return {
    id: newId(),
    sessionId,
    turnId,
    type,
    payload,
    createdAt: new Date().toISOString(),
  }
}

export async function runVerifiedAgentTurn(options: {
  readonly request: AgentTurnRequest
  readonly driver: AgentTurnDriver
  readonly recordAudit: (event: AgentAuditEvent) => Promise<void>
  readonly observe?: (step: AgentTurnStep) => void
  readonly turnId?: string
}): Promise<AgentResultEnvelope> {
  const turnId = options.turnId ?? newId()
  const sessionId = options.request.context.sessionId
  let terminalPhase = 'completed'

  try {
    await options.recordAudit(
      audit(sessionId, turnId, 'turn-started', {
        driver: options.driver.id,
        domainId: options.request.context.domainId,
      }),
    )

    const gated = await runStructuredOutputGate(
      (retry) => options.driver.run({ ...options.request, retry }, options.observe),
      {
        propagateProviderError: (error) => error instanceof AgentTurnCancelledError,
      },
    )

    if (gated.ok) {
      await options.recordAudit(
        audit(sessionId, turnId, 'output-validated', {
          attempts: gated.attempts,
          kind: gated.value.result.kind,
        }),
      )
      return gated.value
    }

    terminalPhase = 'failed'
    await options.recordAudit(
      audit(sessionId, turnId, 'output-rejected', {
        code: gated.code,
        attempts: gated.attempts,
        issues: gated.issues,
      }),
    )
    throw new StructuredOutputTurnError(gated)
  } catch (error) {
    if (error instanceof AgentTurnCancelledError) {
      terminalPhase = 'cancelled'
      throw error
    }
    if (!(error instanceof StructuredOutputTurnError)) terminalPhase = 'failed'
    throw error
  } finally {
    try {
      await options.recordAudit(audit(sessionId, turnId, 'turn-finished', { phase: terminalPhase }))
    } catch (error) {
      console.warn('Failed to persist terminal turn audit', error)
    }
  }
}
