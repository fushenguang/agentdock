export interface ActivityCompletion {
  id: number;
  activityKey: string;
  completedAt: Date;
}

export interface NewActivityCompletion {
  activityKey: string;
}
