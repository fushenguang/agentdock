import "@tanstack/react-start/server-only";
import type { GreetingRepository } from "@/core/repositories/greeting-repository";
import { getSqliteDatabase } from "./db/sqlite/client";
import { SqliteGreetingRepository } from "./db/sqlite/repository";
import { getSupabaseDatabase } from "./db/supabase/client";
import { SupabaseGreetingRepository } from "./db/supabase/repository";

export type DataProvider = "sqlite" | "supabase";

export function getDataProvider(): DataProvider {
  const provider = process.env.DATA_PROVIDER ?? "sqlite";

  if (provider === "sqlite" || provider === "supabase") {
    return provider;
  }

  throw new Error(`Unsupported DATA_PROVIDER "${provider}". Expected "sqlite" or "supabase".`);
}

export function getGreetingRepository(): GreetingRepository {
  if (getDataProvider() === "supabase") {
    return new SupabaseGreetingRepository(getSupabaseDatabase());
  }

  return new SqliteGreetingRepository(getSqliteDatabase());
}
