import { AgentTurnCancelledError } from './types'
import type { AgentAuditEvent, PermissionDecision, PermissionRequest } from './types'
import { newId } from '../../lib/id'

export type PermissionResolver = (request: PermissionRequest) => Promise<PermissionDecision>
export type AuditRecorder = (event: AgentAuditEvent) => Promise<void>

export interface PermissionBroker {
  request(input: PermissionRequest): Promise<PermissionDecision>
}

export function requiresPermission(risk: PermissionRequest['risk']): boolean {
  return risk !== 'readonly'
}

function deniedDecision(requestId: string): PermissionDecision {
  return {
    requestId,
    decision: 'denied',
    decidedAt: new Date().toISOString(),
  }
}

function isUsableDecision(decision: PermissionDecision, request: PermissionRequest): boolean {
  if (decision.requestId !== request.id) return false
  if (decision.decision !== 'allowed' && decision.decision !== 'denied') return false
  if (typeof decision.decidedAt !== 'string') return false
  const decidedAt = Date.parse(decision.decidedAt)
  if (!Number.isFinite(decidedAt) || decidedAt > Date.now()) return false
  if (decision.expiresAt === undefined) return true
  if (typeof decision.expiresAt !== 'string') return false
  const expiresAt = Date.parse(decision.expiresAt)
  return Number.isFinite(expiresAt) && expiresAt > Date.now()
}

export function createPermissionBroker(
  resolve: PermissionResolver,
  recordAudit: AuditRecorder,
): PermissionBroker {
  return {
    async request(permissionRequest: PermissionRequest): Promise<PermissionDecision> {
      await recordAudit({
        id: newId(),
        sessionId: permissionRequest.sessionId,
        turnId: permissionRequest.turnId,
        type: 'permission-requested',
        payload: {
          permissionRequestId: permissionRequest.id,
          toolId: permissionRequest.toolId,
          risk: permissionRequest.risk,
          inputDigest: permissionRequest.inputDigest,
        },
        createdAt: new Date().toISOString(),
      })

      let decision: PermissionDecision
      let decisionReason = 'user-decision'
      let cancellation: AgentTurnCancelledError | undefined
      try {
        const resolved = await resolve(permissionRequest)
        if (isUsableDecision(resolved, permissionRequest)) {
          decision = resolved
        } else {
          decision = deniedDecision(permissionRequest.id)
          decisionReason = 'invalid-or-expired-decision'
        }
      } catch (error) {
        decision = deniedDecision(permissionRequest.id)
        decisionReason =
          error instanceof AgentTurnCancelledError ? 'resolver-cancelled' : 'resolver-failed'
        if (error instanceof AgentTurnCancelledError) cancellation = error
      }

      await recordAudit({
        id: newId(),
        sessionId: permissionRequest.sessionId,
        turnId: permissionRequest.turnId,
        type: 'permission-decided',
        payload: {
          permissionRequestId: permissionRequest.id,
          decision: decision.decision,
          decisionReason,
          inputDigest: permissionRequest.inputDigest,
        },
        createdAt: decision.decidedAt,
      })
      if (cancellation) throw cancellation
      return decision
    },
  }
}
