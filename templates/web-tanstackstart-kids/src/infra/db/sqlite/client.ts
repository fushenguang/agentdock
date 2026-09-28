import "@tanstack/react-start/server-only";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import * as schema from "./schema";

const DEFAULT_DATABASE_URL = "./data/app.db";

export function createSqliteDatabase(
  url = process.env.SQLITE_DATABASE_URL ?? DEFAULT_DATABASE_URL,
) {
  if (url !== ":memory:") {
    mkdirSync(dirname(resolve(url)), { recursive: true });
  }

  const sqlite = new Database(url);
  return drizzle(sqlite, { schema });
}

export type SqliteDatabase = ReturnType<typeof createSqliteDatabase>;

let database: SqliteDatabase | undefined;

export function getSqliteDatabase(): SqliteDatabase {
  database ??= createSqliteDatabase();
  return database;
}
