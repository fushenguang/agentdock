import type { Greeting, NewGreeting } from "@/core/types/greeting";

export interface GreetingRepository {
  list(): Promise<Greeting[]>;
  create(input: NewGreeting): Promise<Greeting>;
}
