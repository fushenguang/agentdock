import * as SQLite from 'expo-sqlite'
import type { AgentAuditEvent, AgentMemoryProjection } from '../../core/agent/types'
import type {
  MemoryRepository,
  OutboxRecord,
  OutboxRepository,
  PermissionDecisionRecord,
  PermissionRepository,
  SessionEventRecord,
  SessionRecord,
  SessionRepository,
} from '../../core/data/contracts'
import { MOBILE_MIGRATIONS } from '../../core/data/migrations'

interface SessionRow {
  id: string
  domain_id: string
  title: string
  status: SessionRecord['status']
  created_at: string
  updated_at: string
}

interface MemoryRow {
  id: string
  session_id: string
  kind: AgentMemoryProjection['kind']
  summary: string
  confidence: number
  created_at: string
}

interface OutboxRow {
  id: string
  aggregate_type: OutboxRecord['aggregateType']
  aggregate_id: string
  operation: string
  payload: string
  status: OutboxRecord['status']
  idempotency_key: string
  created_at: string
}

function now(): string {
  return new Date().toISOString()
}

function decodeSession(row: SessionRow): SessionRecord {
  return {
    id: row.id,
    domainId: row.domain_id,
    title: row.title,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function decodeMemory(row: MemoryRow): AgentMemoryProjection {
  return {
    id: row.id,
    sessionId: row.session_id,
    kind: row.kind,
    summary: row.summary,
    confidence: row.confidence,
    createdAt: row.created_at,
  }
}

function decodeOutbox(row: OutboxRow): OutboxRecord {
  return {
    id: row.id,
    aggregateType: row.aggregate_type,
    aggregateId: row.aggregate_id,
    operation: row.operation,
    payload: JSON.parse(row.payload) as Record<string, unknown>,
    status: row.status,
    idempotencyKey: row.idempotency_key,
    createdAt: row.created_at,
  }
}

function createSessionRepository(db: SQLite.SQLiteDatabase): SessionRepository {
  return {
    create(input) {
      const timestamp = now()
      db.runSync(
        `INSERT INTO sessions (id, domain_id, title, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [input.id, input.domainId, input.title, input.status, timestamp, timestamp],
      )
      return Promise.resolve({ ...input, createdAt: timestamp, updatedAt: timestamp })
    },
    list(limit) {
      const rows = db.getAllSync<SessionRow>(
        `SELECT id, domain_id, title, status, created_at, updated_at
         FROM sessions ORDER BY updated_at DESC LIMIT ?`,
        [limit],
      )
      return Promise.resolve(rows.map(decodeSession))
    },
  }
}

function createEventRepository(db: SQLite.SQLiteDatabase) {
  const append = (input: SessionEventRecord): Promise<void> => {
    db.runSync(
      `INSERT INTO session_events (id, session_id, turn_id, type, payload, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        input.id,
        input.sessionId,
        input.turnId,
        input.type,
        JSON.stringify(input.payload),
        input.createdAt,
      ],
    )
    return Promise.resolve()
  }

  return {
    append,
    appendAudit(event: AgentAuditEvent): Promise<void> {
      return append({
        id: event.id,
        sessionId: event.sessionId,
        turnId: event.turnId,
        type: event.type,
        payload: event.payload,
        createdAt: event.createdAt,
      })
    },
  }
}

function createMemoryRepository(db: SQLite.SQLiteDatabase): MemoryRepository {
  return {
    saveProjection(input) {
      db.runSync(
        `INSERT OR REPLACE INTO memory_projections
         (id, session_id, kind, summary, confidence, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [input.id, input.sessionId, input.kind, input.summary, input.confidence, input.createdAt],
      )
      return Promise.resolve()
    },
    listBySession(sessionId) {
      const rows = db.getAllSync<MemoryRow>(
        `SELECT id, session_id, kind, summary, confidence, created_at
         FROM memory_projections WHERE session_id = ? ORDER BY created_at DESC`,
        [sessionId],
      )
      return Promise.resolve(rows.map(decodeMemory))
    },
  }
}

function createPermissionRepository(db: SQLite.SQLiteDatabase): PermissionRepository {
  return {
    save(input: PermissionDecisionRecord) {
      db.runSync(
        `INSERT INTO permission_decisions
         (id, session_id, turn_id, tool_id, decision, reason, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          input.id,
          input.sessionId,
          input.turnId,
          input.toolId,
          input.decision,
          input.reason,
          input.createdAt,
        ],
      )
      return Promise.resolve()
    },
  }
}

function createOutboxRepository(db: SQLite.SQLiteDatabase): OutboxRepository {
  return {
    enqueue(input) {
      const timestamp = now()
      db.runSync(
        `INSERT INTO sync_outbox
         (id, aggregate_type, aggregate_id, operation, payload, status, idempotency_key, created_at)
         VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`,
        [
          input.id,
          input.aggregateType,
          input.aggregateId,
          input.operation,
          JSON.stringify(input.payload),
          input.idempotencyKey,
          timestamp,
        ],
      )
      return Promise.resolve({ ...input, status: 'pending', createdAt: timestamp })
    },
    listPending(limit) {
      const rows = db.getAllSync<OutboxRow>(
        `SELECT id, aggregate_type, aggregate_id, operation, payload, status, idempotency_key, created_at
         FROM sync_outbox WHERE status = 'pending' ORDER BY created_at ASC LIMIT ?`,
        [limit],
      )
      return Promise.resolve(rows.map(decodeOutbox))
    },
  }
}

export interface MobileDataStore {
  readonly sessions: SessionRepository
  readonly events: ReturnType<typeof createEventRepository>
  readonly memory: MemoryRepository
  readonly permissions: PermissionRepository
  readonly outbox: OutboxRepository
  close(): void
}

export function openMobileDataStore(databaseName = 'thefoolai-agent.db'): MobileDataStore {
  const db = SQLite.openDatabaseSync(databaseName)
  db.execSync('PRAGMA foreign_keys = ON')
  for (const migration of MOBILE_MIGRATIONS) {
    db.execSync(migration.statements.join(';\n'))
    db.runSync('INSERT OR IGNORE INTO schema_migrations (id, applied_at) VALUES (?, ?)', [
      migration.id,
      now(),
    ])
  }

  return {
    sessions: createSessionRepository(db),
    events: createEventRepository(db),
    memory: createMemoryRepository(db),
    permissions: createPermissionRepository(db),
    outbox: createOutboxRepository(db),
    close: () => db.closeSync(),
  }
}
