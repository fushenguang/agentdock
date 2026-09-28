import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { KIDS_EXPERIENCE_COOKIE_NAME, parseKidsExperienceCookie } from "./kids-experience";

export const getServerKidsExperience = createServerFn({ method: "GET" }).handler(() => {
  return parseKidsExperienceCookie(getCookie(KIDS_EXPERIENCE_COOKIE_NAME));
});
