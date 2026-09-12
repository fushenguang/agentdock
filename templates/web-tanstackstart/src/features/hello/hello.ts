import type { Greeting, NewGreeting } from "@/core/types/greeting";
import { getGreetingRepository } from "@/infra/providers";

const MAX_MESSAGE_LENGTH = 120;

export function normalizeGreetingMessage(value: string): string {
  const message = value.trim();

  if (!message) {
    throw new Error("Greeting cannot be empty");
  }

  return message.slice(0, MAX_MESSAGE_LENGTH);
}

export async function listGreetings(): Promise<Greeting[]> {
  return getGreetingRepository().list();
}

export async function createGreeting(input: NewGreeting): Promise<Greeting> {
  return getGreetingRepository().create({
    message: normalizeGreetingMessage(input.message),
  });
}
