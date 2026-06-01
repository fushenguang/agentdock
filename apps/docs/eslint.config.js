// @ts-check
"use strict";

const base = require("@agentdock/eslint-config/base");
const next = require("@agentdock/eslint-config/next");

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