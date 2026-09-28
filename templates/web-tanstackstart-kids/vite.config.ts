import { astryxStylex } from "@astryxdesign/build/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

function clientOnlyLayerSplit(plugins: Plugin[]): Plugin[] {
  return plugins.map((plugin) =>
    plugin.name === "astryx-build-layer-split"
      ? {
          ...plugin,
          applyToEnvironment: (environment) => environment.name === "client",
        }
      : plugin,
  );
}

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "src"),
    },
  },
  plugins: [
    ...clientOnlyLayerSplit(
      astryxStylex({
        dev: process.env.NODE_ENV === "development",
        rootDir,
        stylexOverrides: {
          treeshakeCompensation: true,
          unstable_moduleResolution: {
            type: "commonJS",
            rootDir,
          },
        },
      }),
    ),
    tanstackStart({ srcDirectory: "src" }),
    viteReact(),
  ],
});
