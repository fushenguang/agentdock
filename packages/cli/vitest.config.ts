import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

// Expo template sources are deliberately outside the pnpm workspace, so their
// dependencies are not linked into the root node_modules. Tests import those
// sources directly; resolve the one runtime package they need explicitly.
const zodRoot = fileURLToPath(new URL('./node_modules/zod', import.meta.url))

export default defineConfig({
  resolve: {
    alias: [{ find: /^zod$/, replacement: zodRoot }],
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
})
