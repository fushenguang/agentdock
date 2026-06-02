/**
 * Drizzle extension point — not implemented in Supabase MVP stage.
 *
 * When the team decides to adopt Drizzle ORM, implement the schema here.
 * The IGreetingRepository interface in src/core/repositories/ does not need
 * to change — only the implementation in SupabaseGreetingRepository.ts.
 *
 * Example future implementation:
 *
 * import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
 *
 * export const greetings = pgTable("greetings", {
 *   id: text("id").primaryKey(),
 *   name: text("name").notNull(),
 *   createdAt: timestamp("created_at").notNull().defaultNow(),
 * });
 */

export {}
