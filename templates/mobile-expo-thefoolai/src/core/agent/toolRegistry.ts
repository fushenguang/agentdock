import { requiresPermission } from './permission'
import type { PermissionBroker } from './permission'
import type {
  AgentAuditEvent,
  AgentToolDefinition,
  PermissionRequest,
  ToolRiskLevel,
} from './types'

export class ToolPermissionDeniedError extends Error {
  constructor(
    readonly toolId: string,
    readonly risk: ToolRiskLevel,
  ) {
    super(`Permission denied for tool ${toolId}.`)
    this.name = 'ToolPermissionDeniedError'
  }
}

export interface ToolExecutionContext {
  readonly sessionId: string
  readonly turnId: string
  readonly permissionBroker: PermissionBroker
  readonly recordAudit: (event: AgentAuditEvent) => Promise<void>
}

export function createToolRegistry(
  tools: readonly AgentToolDefinition[],
): ReadonlyMap<string, AgentToolDefinition> {
  return new Map(tools.map((tool) => [tool.id, tool]))
}

function auditEvent(
  context: ToolExecutionContext,
  tool: AgentToolDefinition,
  type: 'tool-started' | 'tool-finished',
): AgentAuditEvent {
  return {
    id: crypto.randomUUID(),
    sessionId: context.sessionId,
    turnId: context.turnId,
    type,
    payload: { toolId: tool.id, risk: tool.risk },
    createdAt: new Date().toISOString(),
  }
}

export async function executeRegisteredTool(
  registry: ReadonlyMap<string, AgentToolDefinition>,
  toolId: string,
  input: unknown,
  context: ToolExecutionContext,
): Promise<unknown> {
  const tool = registry.get(toolId)
  if (!tool) throw new Error(`Unknown tool: ${toolId}`)

  await context.recordAudit(auditEvent(context, tool, 'tool-started'))
  if (requiresPermission(tool.risk)) {
    const request: PermissionRequest = {
      id: crypto.randomUUID(),
      sessionId: context.sessionId,
      turnId: context.turnId,
      toolId: tool.id,
      reason: tool.description,
      risk: tool.risk,
    }
    const decision = await context.permissionBroker.request(request)
    if (decision.decision === 'denied') {
      throw new ToolPermissionDeniedError(tool.id, tool.risk)
    }
  }

  const output = await tool.execute(input)
  await context.recordAudit(auditEvent(context, tool, 'tool-finished'))
  return output
}
