import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const greetings = pgTable("greetings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
