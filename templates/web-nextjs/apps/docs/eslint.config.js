// @ts-check
const base = require("@cogito.ai/eslint-config/base");

/** @type {import("eslint").Linter.Config[]} */
module.exports = [
  {
    ignores: [".next/**", ".source/**"],
  },
  ...base,
];
