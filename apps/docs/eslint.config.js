// @ts-check
"use strict";

const base = require("@cogito.ai/eslint-config/base");
const next = require("@cogito.ai/eslint-config/next");

/** @type {import("eslint").Linter.Config[]} */
module.exports = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "dist/**",
      "**/*.d.ts",
      "**/.source/**",
    ],
  },
  ...base,
  ...next,
];