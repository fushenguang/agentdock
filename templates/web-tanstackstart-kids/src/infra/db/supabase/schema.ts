import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const activityCompletions = pgTable("activity_completions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  activityKey: text("activity_key").notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
});
