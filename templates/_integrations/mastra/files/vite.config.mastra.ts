import { mergeConfig } from "vite";
import baseConfig from "./vite.config.ts";

export default mergeConfig(baseConfig, {
  optimizeDeps: {
    exclude: ["execa"],
  },
});
