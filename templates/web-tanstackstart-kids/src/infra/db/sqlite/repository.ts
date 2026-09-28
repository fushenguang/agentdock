import type { ActivityCompletionRepository } from "@/core/repositories/activity-completion-repository";
import type { ActivityCompletion, NewActivityCompletion } from "@/core/types/activity-completion";
import { desc } from "drizzle-orm";
import type { SqliteDatabase } from "./client";
import { activityCompletions } from "./schema";

function toActivityCompletion(row: typeof activityCompletions.$inferSelect): ActivityCompletion {
  return {
    id: row.id,
    activityKey: row.activityKey,
    completedAt: row.completedAt,
  };
}

export class SqliteActivityCompletionRepository implements ActivityCompletionRepository {
  constructor(private readonly db: SqliteDatabase) {}

  async list(): Promise<ActivityCompletion[]> {
    const rows = this.db
      .select()
      .from(activityCompletions)
      .orderBy(desc(activityCompletions.completedAt))
      .all();
    return rows.map(toActivityCompletion);
  }

  async create(input: NewActivityCompletion): Promise<ActivityCompletion> {
    const row = this.db
      .insert(activityCompletions)
      .values({ activityKey: input.activityKey, completedAt: new Date() })
      .returning()
      .get();

    if (!row) {
      throw new Error("SQLite did not return the completed activity");
    }

    return toActivityCompletion(row);
  }
}
