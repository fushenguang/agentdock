import type { ActivityCompletion, NewActivityCompletion } from "@/core/types/activity-completion";

export interface ActivityCompletionRepository {
  list(): Promise<ActivityCompletion[]>;
  create(input: NewActivityCompletion): Promise<ActivityCompletion>;
}
