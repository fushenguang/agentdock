import { createServerFn } from "@tanstack/react-start";
import {
  createGreeting as createGreetingUseCase,
  listGreetings as listGreetingsUseCase,
} from "./hello";

export const listGreetings = createServerFn({ method: "GET" }).handler(() => {
  return listGreetingsUseCase();
});

export const createGreeting = createServerFn({ method: "POST" })
  .validator((input: { message: string }) => input)
  .handler(({ data }) => {
    return createGreetingUseCase(data);
  });
