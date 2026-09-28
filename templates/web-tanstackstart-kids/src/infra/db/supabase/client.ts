import "@tanstack/react-start/server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export function createSupabaseDatabase(url = process.env.SUPABASE_DATABASE_URL) {
  if (!url) {
    throw new Error("SUPABASE_DATABASE_URL is required when DATA_PROVIDER=supabase");
  }

  const client = postgres(url, { prepare: false });
  return drizzle(client, { schema });
}

export type SupabaseDatabase = ReturnType<typeof createSupabaseDatabase>;

let database: SupabaseDatabase | undefined;

export function getSupabaseDatabase(): SupabaseDatabase {
  database ??= createSupabaseDatabase();
  return database;
}
