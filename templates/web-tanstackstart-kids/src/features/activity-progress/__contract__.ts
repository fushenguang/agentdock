import type { ActivityCompletion, NewActivityCompletion } from "@/core/types/activity-completion";

export interface ActivityProgressFeatureContract {
  listActivityCompletions(): Promise<ActivityCompletion[]>;
  recordActivityCompletion(input: NewActivityCompletion): Promise<ActivityCompletion>;
}
