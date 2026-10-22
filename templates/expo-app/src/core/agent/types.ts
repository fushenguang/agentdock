export const AGENT_PHASES = {
  idle: 'idle',
  listening: 'listening',
  planning: 'planning',
  waitingPermission: 'waiting-permission',
  runningTool: 'running-tool',
  structuring: 'structuring',
  completed: 'completed',
  failed: 'failed',
  cancelled: 'cancelled',
} as const

export type AgentPhase = (typeof AGENT_PHASES)[keyof typeof AGENT_PHASES]

export const TERMINAL_AGENT_PHASES: readonly AgentPhase[] = [
  AGENT_PHASES.idle,
  AGENT_PHASES.completed,
  AGENT_PHASES.failed,
  AGENT_PHASES.cancelled,
] as const

export function isTerminalAgentPhase(phase: AgentPhase): boolean {
  return TERMINAL_AGENT_PHASES.includes(phase)
}

export interface AgentContextEntry {
  readonly id: string
  readonly summary: string
  readonly tokenEstimate: number
}

export interface AgentContextEnvelope {
  readonly sessionId: string
  readonly domainId: string
  readonly locale: string
  readonly intentSummary: string
  readonly compactEntries: readonly AgentContextEntry[]
  readonly totalTokenEstimate: number
}

export interface AgentMemoryProjection {
  readonly id: string
  readonly sessionId: string
  readonly kind: 'fact' | 'preference' | 'task' | 'risk'
  readonly summary: string
  readonly createdAt: string
  readonly confidence: number
}

export interface AgentToolSchemaNode {
  readonly type?: string | readonly string[]
  readonly required?: readonly string[]
  readonly properties?: Record<string, AgentToolSchemaNode>
  readonly items?: AgentToolSchemaNode
  readonly enum?: readonly unknown[]
}

export interface AgentToolSchema extends AgentToolSchemaNode {
  readonly $schema: 'https://json-schema.org/draft/2020-12/schema'
  readonly type: 'object'
  readonly properties: Record<string, AgentToolSchemaNode>
  readonly required: readonly string[]
}

export const TOOL_RISK_LEVELS = {
  readonly: 'readonly',
  localWrite: 'local-write',
  network: 'network',
  sensitive: 'sensitive',
} as const

export type ToolRiskLevel = (typeof TOOL_RISK_LEVELS)[keyof typeof TOOL_RISK_LEVELS]

export type AgentToolExecutor = (input: unknown) => Promise<unknown>

export interface AgentToolDefinition {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly risk: ToolRiskLevel
  readonly inputSchema: AgentToolSchema
  readonly execute: AgentToolExecutor
}

export interface PermissionRequest {
  readonly id: string
  readonly sessionId: string
  readonly turnId: string
  readonly toolId: string
  readonly reason: string
  readonly risk: ToolRiskLevel
  /** SHA-256 digest of the exact serialized input being authorized. */
  readonly inputDigest: string
}

export const PERMISSION_DECISIONS = {
  allowed: 'allowed',
  denied: 'denied',
} as const

export type PermissionDecisionValue =
  (typeof PERMISSION_DECISIONS)[keyof typeof PERMISSION_DECISIONS]

export interface PermissionDecision {
  readonly requestId: string
  readonly decision: PermissionDecisionValue
  readonly decidedAt: string
  readonly expiresAt?: string
}

export interface AgentAuditEvent {
  readonly id: string
  readonly sessionId: string
  readonly turnId: string
  readonly type:
    | 'turn-started'
    | 'stage-changed'
    | 'permission-requested'
    | 'permission-decided'
    | 'tool-started'
    | 'tool-finished'
    | 'output-validated'
    | 'output-rejected'
    | 'turn-finished'
  readonly payload: Record<string, unknown>
  readonly createdAt: string
}

export interface AgentTurnRequest {
  readonly userText: string
  readonly context: AgentContextEnvelope
  readonly retry?: AgentTurnRetryContext
  readonly isCancelled?: () => boolean
}

export class AgentTurnCancelledError extends Error {
  constructor() {
    super('Agent turn was cancelled.')
    this.name = 'AgentTurnCancelledError'
  }
}

export interface AgentTurnRetryContext {
  readonly attempt: number
  readonly schemaVersion: string
  readonly issues: readonly AgentTurnValidationIssue[]
  readonly instruction: string
}

export interface AgentTurnValidationIssue {
  readonly path: string
  readonly message: string
}

export interface AgentTurnStep {
  readonly id: string
  readonly label: string
  readonly kind: 'reasoning' | 'tool' | 'script' | 'validation'
  readonly status: 'running' | 'succeeded' | 'failed' | 'skipped'
  readonly startedAt: string
  readonly finishedAt?: string
}

export type AgentTurnObserver = (step: AgentTurnStep) => void

export interface AgentTurnDriver {
  readonly id: string
  run(request: AgentTurnRequest, observe?: AgentTurnObserver): Promise<unknown>
}
