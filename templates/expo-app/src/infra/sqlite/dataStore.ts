import * as SQLite from 'expo-sqlite'
import type { AgentAuditEvent, AgentMemoryProjection } from '../../core/agent/types'
import type {
  AgentAuditRepository,
  MemoryRepository,
  OutboxRecord,
  OutboxRepository,
  PermissionDecisionRecord,
  PermissionRepository,
  SessionEventRecord,
  SessionRecord,
  SessionRepository,
  UserPreferenceRecord,
  UserPreferenceRepository,
} from '../../core/data/contracts'
import { MOBILE_MIGRATIONS } from '../../core/data/migrations'
import { newId } from '../../lib/id'

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
  attempts: number
  last_error: string | null
  created_at: string
  updated_at: string
}

interface UserPreferenceRow {
  readonly key: string
  readonly value: string
  readonly updated_at: string
}

interface SessionCountRow {
  readonly count: number
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

function decodePayload(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw) as unknown
    return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : { malformedPayload: raw }
  } catch (error) {
    console.warn('Malformed outbox payload; falling back to raw value', error)
    return { malformedPayload: raw }
  }
}

function decodeOutbox(row: OutboxRow): OutboxRecord {
  return {
    id: row.id,
    aggregateType: row.aggregate_type,
    aggregateId: row.aggregate_id,
    operation: row.operation,
    payload: decodePayload(row.payload),
    status: row.status,
    idempotencyKey: row.idempotency_key,
    createdAt: row.created_at,
  }
}

function decodeUserPreference(row: UserPreferenceRow): UserPreferenceRecord {
  return {
    key: row.key,
    value: row.value,
    updatedAt: row.updated_at,
  }
}

function escapeLikeQuery(query: string): string {
  return `%${query.replace(/[\\%_]/g, '\\$&')}%`
}

function createSessionRepository(db: SQLite.SQLiteDatabase): SessionRepository {
  return {
    async create(input) {
      const timestamp = now()
      await db.runAsync(
        `INSERT INTO sessions (id, domain_id, title, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [input.id, input.domainId, input.title, input.status, timestamp, timestamp],
      )
      return { ...input, createdAt: timestamp, updatedAt: timestamp }
    },
    async ensure(input) {
      const timestamp = now()
      await db.runAsync(
        `INSERT OR IGNORE INTO sessions (id, domain_id, title, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [input.id, input.domainId, input.title, input.status, timestamp, timestamp],
      )
      const row = await db.getFirstAsync<SessionRow>(
        `SELECT id, domain_id, title, status, created_at, updated_at
         FROM sessions WHERE id = ?`,
        [input.id],
      )
      if (!row) throw new Error(`Failed to ensure session ${input.id}.`)
      return decodeSession(row)
    },
    async touch(id) {
      await db.runAsync('UPDATE sessions SET updated_at = ? WHERE id = ?', [now(), id])
    },
    async list(limit) {
      const rows = await db.getAllAsync<SessionRow>(
        `SELECT id, domain_id, title, status, created_at, updated_at
         FROM sessions ORDER BY updated_at DESC LIMIT ?`,
        [limit],
      )
      return rows.map(decodeSession)
    },
    async search(query, limit) {
      const normalizedQuery = query.trim()
      if (normalizedQuery.length === 0) return []

      const pattern = escapeLikeQuery(normalizedQuery)
      const rows = await db.getAllAsync<SessionRow>(
        `SELECT id, domain_id, title, status, created_at, updated_at
         FROM sessions
         WHERE title LIKE ? ESCAPE '\\' OR domain_id LIKE ? ESCAPE '\\'
         ORDER BY updated_at DESC
         LIMIT ?`,
        [pattern, pattern, limit],
      )
      return rows.map(decodeSession)
    },
    async count() {
      const row = await db.getFirstAsync<SessionCountRow>('SELECT COUNT(*) AS count FROM sessions')
      return row?.count ?? 0
    },
  }
}

function createEventRepository(db: SQLite.SQLiteDatabase): AgentAuditRepository {
  const append = async (input: SessionEventRecord): Promise<void> => {
    await db.runAsync(
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
  }

  return {
    append,
    async appendAudit(event: AgentAuditEvent) {
      await append({
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
    async saveProjection(input) {
      await db.runAsync(
        `INSERT OR REPLACE INTO memory_projections
         (id, session_id, kind, summary, confidence, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [input.id, input.sessionId, input.kind, input.summary, input.confidence, input.createdAt],
      )
    },
    async listBySession(sessionId) {
      const rows = await db.getAllAsync<MemoryRow>(
        `SELECT id, session_id, kind, summary, confidence, created_at
         FROM memory_projections WHERE session_id = ? ORDER BY created_at DESC`,
        [sessionId],
      )
      return rows.map(decodeMemory)
    },
  }
}

function createPermissionRepository(db: SQLite.SQLiteDatabase): PermissionRepository {
  return {
    async save(input: PermissionDecisionRecord) {
      await db.runAsync(
        `INSERT INTO permission_decisions
         (id, session_id, turn_id, tool_id, decision, reason, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           decision = excluded.decision,
           reason = excluded.reason,
           created_at = excluded.created_at`,
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
    },
  }
}

function createOutboxRepository(db: SQLite.SQLiteDatabase): OutboxRepository {
  const selectById = `SELECT id, aggregate_type, aggregate_id, operation, payload, status,
       idempotency_key, attempts, last_error, created_at, updated_at
       FROM sync_outbox WHERE id = ?`

  return {
    async enqueue(input) {
      const id = newId()
      const timestamp = now()
      await db.runAsync(
        `INSERT INTO sync_outbox
         (id, aggregate_type, aggregate_id, operation, payload, status, idempotency_key,
          attempts, last_error, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'pending', ?, 0, NULL, ?, ?)
         ON CONFLICT(idempotency_key) DO NOTHING`,
        [
          id,
          input.aggregateType,
          input.aggregateId,
          input.operation,
          JSON.stringify(input.payload),
          input.idempotencyKey,
          timestamp,
          timestamp,
        ],
      )

      const row = await db.getFirstAsync<OutboxRow>(selectById, [id])
      if (row) return decodeOutbox(row)

      const existing = await db.getFirstAsync<OutboxRow>(
        `SELECT id, aggregate_type, aggregate_id, operation, payload, status,
         idempotency_key, attempts, last_error, created_at, updated_at
         FROM sync_outbox WHERE idempotency_key = ?`,
        [input.idempotencyKey],
      )
      if (!existing) throw new Error('Failed to enqueue outbox record.')
      return decodeOutbox(existing)
    },
    async listPending(limit) {
      const rows = await db.getAllAsync<OutboxRow>(
        `SELECT id, aggregate_type, aggregate_id, operation, payload, status,
         idempotency_key, attempts, last_error, created_at, updated_at
         FROM sync_outbox
         WHERE status = 'pending'
           OR (status = 'failed' AND attempts < 5)
         ORDER BY attempts ASC, created_at ASC
         LIMIT ?`,
        [limit],
      )
      return rows.map(decodeOutbox)
    },
    async markSent(id) {
      await db.runAsync(
        `UPDATE sync_outbox
         SET status = 'sent', attempts = attempts + 1, last_error = NULL, updated_at = ?
         WHERE id = ? AND status IN ('pending', 'failed')`,
        [now(), id],
      )
    },
    async markFailed(id, error) {
      await db.runAsync(
        `UPDATE sync_outbox
         SET status = 'failed', attempts = attempts + 1, last_error = ?, updated_at = ?
         WHERE id = ? AND status IN ('pending', 'failed')`,
        [error, now(), id],
      )
    },
  }
}

function createUserPreferenceRepository(db: SQLite.SQLiteDatabase): UserPreferenceRepository {
  return {
    async get(key) {
      const row = await db.getFirstAsync<UserPreferenceRow>(
        'SELECT key, value, updated_at FROM user_preferences WHERE key = ?',
        [key],
      )
      return row ? decodeUserPreference(row) : undefined
    },
    async set(input) {
      await db.runAsync(
        `INSERT INTO user_preferences (key, value, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
        [input.key, input.value, input.updatedAt],
      )
      return input
    },
  }
}

export interface MobileDataStore {
  readonly sessions: SessionRepository
  readonly events: AgentAuditRepository
  readonly memory: MemoryRepository
  readonly permissions: PermissionRepository
  readonly outbox: OutboxRepository
  readonly preferences: UserPreferenceRepository
  close(): Promise<void>
}

const DEFAULT_DATABASE_NAME = 'thefoolai-agent.db'

interface MobileDataStoreCacheEntry {
  promise: Promise<MobileDataStore>
  store: MobileDataStore | undefined
}

const mobileDataStores = new Map<string, MobileDataStoreCacheEntry>()

async function openCachedMobileDataStore(
  databaseName: string,
  cacheEntry: MobileDataStoreCacheEntry,
): Promise<MobileDataStore> {
  const store = await openMobileDataStore(databaseName)
  const wrappedStore: MobileDataStore = {
    ...store,
    close: async () => {
      if (mobileDataStores.get(databaseName) === cacheEntry) {
        mobileDataStores.delete(databaseName)
      }
      await store.close()
    },
  }
  cacheEntry.store = wrappedStore
  return wrappedStore
}

export function getMobileDataStore(databaseName = DEFAULT_DATABASE_NAME): Promise<MobileDataStore> {
  const cachedEntry = mobileDataStores.get(databaseName)
  if (cachedEntry) {
    if (cachedEntry.store) return Promise.resolve(cachedEntry.store)
    return cachedEntry.promise
  }

  const cacheEntry = { store: undefined } as MobileDataStoreCacheEntry
  cacheEntry.promise = openCachedMobileDataStore(databaseName, cacheEntry).catch(
    (error: unknown) => {
      if (mobileDataStores.get(databaseName) === cacheEntry) {
        mobileDataStores.delete(databaseName)
      }
      throw error
    },
  )
  mobileDataStores.set(databaseName, cacheEntry)
  return cacheEntry.promise
}

export async function openMobileDataStore(
  databaseName = DEFAULT_DATABASE_NAME,
): Promise<MobileDataStore> {
  const db = await SQLite.openDatabaseAsync(databaseName)
  await db.execAsync('PRAGMA foreign_keys = ON')
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )`,
  )
  const appliedRows = await db.getAllAsync<{ readonly id: string }>(
    'SELECT id FROM schema_migrations',
  )
  const applied = new Set(appliedRows.map((row) => row.id))

  for (const migration of MOBILE_MIGRATIONS) {
    if (applied.has(migration.id)) continue
    await db.withTransactionAsync(async () => {
      await db.execAsync(migration.statements.join(';\n'))
      await db.runAsync('INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)', [
        migration.id,
        now(),
      ])
    })
  }

  return {
    sessions: createSessionRepository(db),
    events: createEventRepository(db),
    memory: createMemoryRepository(db),
    permissions: createPermissionRepository(db),
    outbox: createOutboxRepository(db),
    preferences: createUserPreferenceRepository(db),
    close: () => db.closeAsync(),
  }
}
