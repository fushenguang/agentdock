// @ts-check
const base = require("@agentdock/eslint-config/base");
const features = require("@agentdock/eslint-config/features");

/** @type {import("eslint").Linter.Config[]} */
module.exports = [
  {
    ignores: [".next/**"],
  },
  ...base,
  ...features,
];
