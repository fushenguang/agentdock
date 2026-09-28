import type { ActivityCompletion, NewActivityCompletion } from "@/core/types/activity-completion";
import { getActivityCompletionRepository } from "@/infra/providers";

const ACTIVITY_KEY_PATTERN = /^[a-z0-9][a-z0-9-]{1,79}$/;

export function normalizeActivityKey(value: string): string {
  const activityKey = value.trim().toLowerCase();

  if (!ACTIVITY_KEY_PATTERN.test(activityKey)) {
    throw new Error("Activity key must be a short kebab-case identifier");
  }

  return activityKey;
}

export async function listActivityCompletions(): Promise<ActivityCompletion[]> {
  return getActivityCompletionRepository().list();
}

export async function recordActivityCompletion(
  input: NewActivityCompletion,
): Promise<ActivityCompletion> {
  return getActivityCompletionRepository().create({
    activityKey: normalizeActivityKey(input.activityKey),
  });
}
