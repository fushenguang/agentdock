import type { AgentAuditEvent, PermissionDecision, PermissionRequest, ToolRiskLevel } from './types'

export type PermissionResolver = (request: PermissionRequest) => Promise<PermissionDecision>
export type AuditRecorder = (event: AgentAuditEvent) => Promise<void>

export interface PermissionBroker {
  request(input: PermissionRequest): Promise<PermissionDecision>
}

export function requiresPermission(risk: ToolRiskLevel): boolean {
  return risk !== 'readonly'
}

export function createPermissionBroker(
  resolve: PermissionResolver,
  recordAudit: AuditRecorder,
): PermissionBroker {
  return {
    async request(request: PermissionRequest): Promise<PermissionDecision> {
      await recordAudit({
        id: crypto.randomUUID(),
        sessionId: request.sessionId,
        turnId: request.turnId,
        type: 'permission-requested',
        payload: { permissionRequestId: request.id, toolId: request.toolId, risk: request.risk },
        createdAt: new Date().toISOString(),
      })

      const decision = await resolve(request)
      await recordAudit({
        id: crypto.randomUUID(),
        sessionId: request.sessionId,
        turnId: request.turnId,
        type: 'permission-decided',
        payload: { permissionRequestId: request.id, decision: decision.decision },
        createdAt: decision.decidedAt,
      })
      return decision
    },
  }
}
