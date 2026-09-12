import type { GreetingRepository } from "@/core/repositories/greeting-repository";
import type { Greeting, NewGreeting } from "@/core/types/greeting";
import { desc } from "drizzle-orm";
import type { SupabaseDatabase } from "./client";
import { greetings } from "./schema";

function toGreeting(row: typeof greetings.$inferSelect): Greeting {
  return {
    id: row.id,
    message: row.message,
    createdAt: row.createdAt,
  };
}

export class SupabaseGreetingRepository implements GreetingRepository {
  constructor(private readonly db: SupabaseDatabase) {}

  async list(): Promise<Greeting[]> {
    const rows = await this.db.select().from(greetings).orderBy(desc(greetings.createdAt));
    return rows.map(toGreeting);
  }

  async create(input: NewGreeting): Promise<Greeting> {
    const [row] = await this.db.insert(greetings).values({ message: input.message }).returning();
    if (!row) {
      throw new Error("Supabase did not return the inserted greeting");
    }
    return toGreeting(row);
  }
}
