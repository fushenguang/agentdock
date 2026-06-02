/**
 * Hello feature — pure business logic, no side effects.
 */

/**
 * Returns a greeting string for the given name.
 * Falls back to "World" when name is empty.
 */
export function greet(name: string): string {
  const target = name.trim() || "World";
  return `Hello, ${target}!`;
}
