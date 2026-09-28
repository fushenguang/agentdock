import type { ActivityCompletionRepository } from "@/core/repositories/activity-completion-repository";
import type { ActivityCompletion, NewActivityCompletion } from "@/core/types/activity-completion";
import { desc } from "drizzle-orm";
import type { SupabaseDatabase } from "./client";
import { activityCompletions } from "./schema";

function toActivityCompletion(row: typeof activityCompletions.$inferSelect): ActivityCompletion {
  return {
    id: row.id,
    activityKey: row.activityKey,
    completedAt: row.completedAt,
  };
}

export class SupabaseActivityCompletionRepository implements ActivityCompletionRepository {
  constructor(private readonly db: SupabaseDatabase) {}

  async list(): Promise<ActivityCompletion[]> {
    const rows = await this.db
      .select()
      .from(activityCompletions)
      .orderBy(desc(activityCompletions.completedAt));
    return rows.map(toActivityCompletion);
  }

  async create(input: NewActivityCompletion): Promise<ActivityCompletion> {
    const [row] = await this.db
      .insert(activityCompletions)
      .values({ activityKey: input.activityKey })
      .returning();
    if (!row) {
      throw new Error("Supabase did not return the completed activity");
    }
    return toActivityCompletion(row);
  }
}
