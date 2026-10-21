export interface MobileMigration {
  readonly id: string
  readonly statements: readonly string[]
}

export const MOBILE_MIGRATIONS: readonly MobileMigration[] = [
  {
    id: '0001_initial_agent_host',
    statements: [
      `CREATE TABLE IF NOT EXISTS schema_migrations (
        id TEXT PRIMARY KEY,
        applied_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        domain_id TEXT NOT NULL,
        title TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('draft','active','archived')),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS session_events (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES sessions(id),
        turn_id TEXT NOT NULL,
        type TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS session_events_session_idx ON session_events(session_id, created_at)`,
      `CREATE TABLE IF NOT EXISTS memory_projections (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES sessions(id),
        kind TEXT NOT NULL,
        summary TEXT NOT NULL,
        confidence REAL NOT NULL,
        created_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS permission_decisions (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        turn_id TEXT NOT NULL,
        tool_id TEXT NOT NULL,
        decision TEXT NOT NULL CHECK(decision IN ('allowed','denied')),
        reason TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS sync_outbox (
        id TEXT PRIMARY KEY,
        aggregate_type TEXT NOT NULL,
        aggregate_id TEXT NOT NULL,
        operation TEXT NOT NULL,
        payload TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('pending','sent','failed')),
        idempotency_key TEXT UNIQUE NOT NULL,
        created_at TEXT NOT NULL
      )`,
    ],
  },
  {
    id: '0002_foreign_keys_outbox_retry_and_indexes',
    statements: [
      `CREATE TABLE session_events_v2 (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        turn_id TEXT NOT NULL,
        type TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`,
      `INSERT INTO session_events_v2
         SELECT id, session_id, turn_id, type, payload, created_at FROM session_events`,
      `DROP TABLE session_events`,
      `ALTER TABLE session_events_v2 RENAME TO session_events`,
      `CREATE INDEX IF NOT EXISTS session_events_session_idx
         ON session_events(session_id, created_at)`,
      `CREATE TABLE memory_projections_v2 (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        kind TEXT NOT NULL,
        summary TEXT NOT NULL,
        confidence REAL NOT NULL,
        created_at TEXT NOT NULL
      )`,
      `INSERT INTO memory_projections_v2
         SELECT id, session_id, kind, summary, confidence, created_at FROM memory_projections`,
      `DROP TABLE memory_projections`,
      `ALTER TABLE memory_projections_v2 RENAME TO memory_projections`,
      `CREATE INDEX IF NOT EXISTS memory_projections_session_idx
         ON memory_projections(session_id, created_at DESC)`,
      `CREATE TABLE permission_decisions_v2 (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        turn_id TEXT NOT NULL,
        tool_id TEXT NOT NULL,
        decision TEXT NOT NULL CHECK(decision IN ('allowed','denied')),
        reason TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`,
      `INSERT INTO permission_decisions_v2
         SELECT id, session_id, turn_id, tool_id, decision, reason, created_at
         FROM permission_decisions`,
      `DROP TABLE permission_decisions`,
      `ALTER TABLE permission_decisions_v2 RENAME TO permission_decisions`,
      `CREATE INDEX IF NOT EXISTS permission_decisions_session_idx
         ON permission_decisions(session_id, created_at)`,
      `CREATE TABLE sync_outbox_v2 (
        id TEXT PRIMARY KEY,
        aggregate_type TEXT NOT NULL,
        aggregate_id TEXT NOT NULL,
        operation TEXT NOT NULL,
        payload TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('pending','sent','failed')),
        idempotency_key TEXT UNIQUE NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        last_error TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `INSERT INTO sync_outbox_v2
         (id, aggregate_type, aggregate_id, operation, payload, status, idempotency_key,
          attempts, last_error, created_at, updated_at)
         SELECT id, aggregate_type, aggregate_id, operation, payload, status, idempotency_key,
                0, NULL, created_at, created_at
         FROM sync_outbox`,
      `DROP TABLE sync_outbox`,
      `ALTER TABLE sync_outbox_v2 RENAME TO sync_outbox`,
      `CREATE INDEX IF NOT EXISTS sync_outbox_pending_idx
         ON sync_outbox(status, attempts, created_at)`,
    ],
  },
]
