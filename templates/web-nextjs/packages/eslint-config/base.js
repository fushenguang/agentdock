// @ts-check
// Base ESLint config — TypeScript-safe rules for all packages
// Compatible with ESLint v9 flat config format
"use strict";

const tseslint = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");

/** @type {import("eslint").Linter.Config[]} */
const base = [
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "@typescript-eslint": tseslint,
    },
    languageOptions: {
      parser: tsParser,
    },
    rules: {
      // @ts-ignore without an explanation is a code smell and bypasses type safety.
      // Developers must justify why TypeScript's type system cannot handle the situation.
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-ignore": "allow-with-description",
          "ts-expect-error": "allow-with-description",
          minimumDescriptionLength: 10,
        },
      ],
    },
  },
];

module.exports = base;
