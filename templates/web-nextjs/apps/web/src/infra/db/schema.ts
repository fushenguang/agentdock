/**
 * Drizzle extension point — not implemented in Supabase MVP stage.
 *
 * When the team decides to adopt Drizzle ORM, implement the schema here.
 * Define your tables using `pgTable` from `drizzle-orm/pg-core` and export
 * them so that `infra/db` implementations can reference the typed schema.
 *
 * Example:
 *
 * import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
 *
 * export const profiles = pgTable("profiles", {
 *   id: text("id").primaryKey(),
 *   email: text("email").notNull(),
 *   createdAt: timestamp("created_at").notNull().defaultNow(),
 * });
 */

export {}
