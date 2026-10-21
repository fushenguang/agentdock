import type { AgentAuditEvent, AgentMemoryProjection } from '../agent/types'

export interface SessionRecord {
  readonly id: string
  readonly domainId: string
  readonly title: string
  readonly status: 'draft' | 'active' | 'archived'
  readonly createdAt: string
  readonly updatedAt: string
}

export interface SessionEventRecord {
  readonly id: string
  readonly sessionId: string
  readonly turnId: string
  readonly type: string
  readonly payload: Record<string, unknown>
  readonly createdAt: string
}

export interface PermissionDecisionRecord {
  readonly id: string
  readonly sessionId: string
  readonly turnId: string
  readonly toolId: string
  readonly decision: 'allowed' | 'denied'
  readonly reason: string
  readonly createdAt: string
}

export interface OutboxRecord {
  readonly id: string
  readonly aggregateType: 'session' | 'event' | 'memory' | 'permission'
  readonly aggregateId: string
  readonly operation: string
  readonly payload: Record<string, unknown>
  readonly status: 'pending' | 'sent' | 'failed'
  readonly idempotencyKey: string
  readonly createdAt: string
}

export interface SessionRepository {
  create(input: Omit<SessionRecord, 'createdAt' | 'updatedAt'>): Promise<SessionRecord>
  list(limit: number): Promise<readonly SessionRecord[]>
}

export interface SessionEventRepository {
  append(input: SessionEventRecord): Promise<void>
}

export interface MemoryRepository {
  saveProjection(input: AgentMemoryProjection): Promise<void>
  listBySession(sessionId: string): Promise<readonly AgentMemoryProjection[]>
}

export interface PermissionRepository {
  save(input: PermissionDecisionRecord): Promise<void>
}

export interface OutboxRepository {
  enqueue(input: Omit<OutboxRecord, 'status' | 'createdAt'>): Promise<OutboxRecord>
  listPending(limit: number): Promise<readonly OutboxRecord[]>
}

export interface AgentAuditRepository extends SessionEventRepository {
  appendAudit(event: AgentAuditEvent): Promise<void>
}
