// @ts-check
// Next.js specific ESLint config — extends base with Next.js conventions
// Compatible with ESLint v9 flat config format
"use strict";

/** @type {import("eslint").Linter.Config[]} */
const next = [
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      // Discourage console.log in production code; warn so devs notice but are not blocked
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  {
    // Route handlers and server components may use console for server-side logging
    files: ["**/app/**/*.{ts,tsx}", "**/pages/api/**/*.{ts,tsx}"],
    rules: {
      "no-console": "off",
    },
  },
];

module.exports = next;
