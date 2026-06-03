// @ts-check
const base = require("@cogito.ai/eslint-config/base");
const features = require("@cogito.ai/eslint-config/features");

/** @type {import("eslint").Linter.Config[]} */
module.exports = [
  {
    ignores: [".next/**"],
  },
  ...base,
  ...features,
];
