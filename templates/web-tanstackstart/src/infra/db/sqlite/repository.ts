import type { GreetingRepository } from "@/core/repositories/greeting-repository";
import type { Greeting, NewGreeting } from "@/core/types/greeting";
import { desc } from "drizzle-orm";
import type { SqliteDatabase } from "./client";
import { greetings } from "./schema";

function toGreeting(row: typeof greetings.$inferSelect): Greeting {
  return {
    id: row.id,
    message: row.message,
    createdAt: row.createdAt,
  };
}

export class SqliteGreetingRepository implements GreetingRepository {
  constructor(private readonly db: SqliteDatabase) {}

  async list(): Promise<Greeting[]> {
    const rows = this.db.select().from(greetings).orderBy(desc(greetings.createdAt)).all();
    return rows.map(toGreeting);
  }

  async create(input: NewGreeting): Promise<Greeting> {
    const row = this.db
      .insert(greetings)
      .values({ message: input.message, createdAt: new Date() })
      .returning()
      .get();

    if (!row) {
      throw new Error("SQLite did not return the inserted greeting");
    }

    return toGreeting(row);
  }
}
