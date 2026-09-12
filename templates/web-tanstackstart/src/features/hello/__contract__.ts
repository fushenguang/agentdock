import type { Greeting, NewGreeting } from "@/core/types/greeting";

export interface HelloFeatureContract {
  listGreetings(): Promise<Greeting[]>;
  createGreeting(input: NewGreeting): Promise<Greeting>;
}
