// @ts-check
// Root ESLint config for the AgentDock meta-repository
//
// Meta-repo exemption (Decision D2): this file does NOT extend the 'features' config.
// There is no src/features/ in this repo — the features rules apply only to templates.
// See: openspec/changes/add-layer2-constraint-gates/design.md
"use strict";

const base = require("@cogito.ai/eslint-config/base");

/** @type {import("eslint").Linter.Config[]} */
module.exports = [
  {
    // Global ignores — these paths are not linted by ESLint
    ignores: [
      "node_modules/**",
      "dist/**",
      ".next/**",
      ".turbo/**",
      "**/*.d.ts",
      // Apps manage their own lint setup
      "apps/**",
      // Templates manage their own lint setup
      "templates/**",
      // Generated / compiled output
      "**/.source/**",
      "pnpm-lock.yaml",
    ],
  },
  // Apply base TypeScript rules to scripts and packages
  ...base,
  {
    // Scripts are allowed to use console
    files: ["scripts/**/*.ts"],
    rules: {
      "no-console": "off",
    },
  },
];
