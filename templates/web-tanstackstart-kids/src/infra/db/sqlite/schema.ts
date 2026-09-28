import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const activityCompletions = sqliteTable("activity_completions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  activityKey: text("activity_key").notNull(),
  completedAt: integer("completed_at", { mode: "timestamp" }).notNull(),
});
