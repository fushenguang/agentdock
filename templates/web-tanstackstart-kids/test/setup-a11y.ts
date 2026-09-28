import "vitest-axe/extend-expect";

if (typeof window !== "undefined") {
  window.scrollTo = () => undefined;
}
