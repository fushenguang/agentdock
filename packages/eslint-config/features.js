// @ts-check
// Feature-layer architecture rules — applies only to src/features/**
// These are "teeth" rules: error from day one, no grace period.
// Templates must explicitly extend this config to activate these rules.
"use strict";

const path = require("path");
const fs = require("fs");

// ---------------------------------------------------------------------------
// Custom rule: require-feature-contract
// Every src/features/<name>/ directory MUST contain __contract__.ts.
// ---------------------------------------------------------------------------
/** @type {import("eslint").Rule.RuleModule} */
const requireFeatureContractRule = {
  meta: {
    type: "problem",
    schema: [],
    messages: {
      missingContract:
        "Feature '{{ featureName }}' is missing __contract__.ts. Every feature directory must export a typed contract.",
    },
  },
  create(context) {
    const filePath = context.filename;
    // Match the feature root directory: .../src/features/<name>/...
    const match = filePath.match(
      /^(.*[/\\]src[/\\]features[/\\][^/\\]+)[/\\]/
    );
    if (!match) return {};

    const featureDir = match[1];
    const featureName = path.basename(featureDir);
    const contractPath = path.join(featureDir, "__contract__.ts");

    if (!fs.existsSync(contractPath)) {
      return {
        Program(node) {
          context.report({
            node,
            messageId: "missingContract",
            data: { featureName },
          });
        },
      };
    }
    return {};
  },
};

/** @type {import("eslint").Linter.Config[]} */
const features = [
  {
    // Scope these rules to feature-layer source files only.
    // Exclude type declarations and test fixtures to avoid false positives.
    files: ["**/src/features/**/*.{ts,tsx}"],
    ignores: ["**/*.d.ts", "**/__fixtures__/**", "**/__tests__/**"],
    plugins: {
      "agentdock-arch": {
        rules: {
          "require-feature-contract": requireFeatureContractRule,
        },
      },
    },
    rules: {
      // Features must not directly access DB clients — use repositories from core.
      // Handles path aliases (@/infra/db/**) and relative imports.
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/infra/db/**", "**/infra/db"],
              message:
                "Direct DB access in features is not allowed. Use repositories from src/core/repositories instead.",
            },
          ],
        },
      ],
      // Each feature directory must export a typed __contract__.ts.
      "agentdock-arch/require-feature-contract": "error",
    },
  },
];

module.exports = features;
