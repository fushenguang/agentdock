import { astryxStylex } from "@astryxdesign/build/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "src"),
    },
  },
  plugins: [
    astryxStylex({
      dev: false,
      rootDir,
      stylexOverrides: {
        treeshakeCompensation: true,
        unstable_moduleResolution: {
          type: "commonJS",
          rootDir,
        },
      },
    }),
  ],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    exclude: ["src/**/*.a11y.test.tsx"],
  },
});
