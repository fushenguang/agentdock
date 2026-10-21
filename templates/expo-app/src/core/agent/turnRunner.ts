import type { AgentResultEnvelope } from './agent-result'
import { runStructuredOutputGate, type StructuredOutputResult } from './structured-output-gate'
import type { AgentAuditEvent, AgentTurnDriver, AgentTurnRequest, AgentTurnStep } from './types'

export class StructuredOutputTurnError extends Error {
  constructor(readonly failure: Extract<StructuredOutputResult, { ok: false }>) {
    super(failure.ok ? 'Structured output unexpectedly succeeded.' : failure.message)
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
    id: crypto.randomUUID(),
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
}): Promise<AgentResultEnvelope> {
  const turnId = crypto.randomUUID()
  await options.recordAudit(
    audit(options.request.sessionId, turnId, 'turn-started', {
      driver: options.driver.id,
      domainId: options.request.domainId,
    }),
  )

  const gated = await runStructuredOutputGate((retry) =>
    options.driver.run({ ...options.request, retry }, options.observe),
  )

  if (gated.ok) {
    await options.recordAudit(
      audit(options.request.sessionId, turnId, 'output-validated', {
        attempts: gated.attempts,
        kind: gated.value.result.kind,
      }),
    )
    await options.recordAudit(
      audit(options.request.sessionId, turnId, 'turn-finished', { phase: 'completed' }),
    )
    return gated.value
  }

  await options.recordAudit(
    audit(options.request.sessionId, turnId, 'output-rejected', {
      code: gated.code,
      attempts: gated.attempts,
      issues: gated.issues,
    }),
  )
  await options.recordAudit(
    audit(options.request.sessionId, turnId, 'turn-finished', { phase: 'failed' }),
  )
  throw new StructuredOutputTurnError(gated)
}
