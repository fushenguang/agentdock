import { createServerFn } from "@tanstack/react-start";
import {
  listActivityCompletions as listActivityCompletionsUseCase,
  recordActivityCompletion as recordActivityCompletionUseCase,
} from "./activity-progress";

export const listActivityCompletions = createServerFn({ method: "GET" }).handler(() => {
  return listActivityCompletionsUseCase();
});

export const recordActivityCompletion = createServerFn({ method: "POST" })
  .validator((input: { activityKey: string }) => input)
  .handler(({ data }) => {
    return recordActivityCompletionUseCase(data);
  });
