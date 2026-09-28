import "@tanstack/react-start/server-only";
import type { ActivityCompletionRepository } from "@/core/repositories/activity-completion-repository";
import { getSqliteDatabase } from "./db/sqlite/client";
import { SqliteActivityCompletionRepository } from "./db/sqlite/repository";
import { getSupabaseDatabase } from "./db/supabase/client";
import { SupabaseActivityCompletionRepository } from "./db/supabase/repository";

export type DataProvider = "sqlite" | "supabase";

export function getDataProvider(): DataProvider {
  const provider = process.env.DATA_PROVIDER ?? "sqlite";

  if (provider === "sqlite" || provider === "supabase") {
    return provider;
  }

  throw new Error(`Unsupported DATA_PROVIDER "${provider}". Expected "sqlite" or "supabase".`);
}

export function getActivityCompletionRepository(): ActivityCompletionRepository {
  if (getDataProvider() === "supabase") {
    return new SupabaseActivityCompletionRepository(getSupabaseDatabase());
  }

  return new SqliteActivityCompletionRepository(getSqliteDatabase());
}
