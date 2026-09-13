import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { APPEARANCE_COOKIE_NAME, parseAppearanceCookie } from "./appearance";

export const getServerAppearance = createServerFn({ method: "GET" }).handler(() => {
  return parseAppearanceCookie(getCookie(APPEARANCE_COOKIE_NAME));
});
