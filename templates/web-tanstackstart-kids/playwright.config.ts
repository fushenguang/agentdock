import { defineConfig, devices } from "@playwright/test";

const port = process.env.PLAYWRIGHT_PORT ?? "3000";
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/visual",
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npx --yes pnpm@12.4.1 dev:prepare && npx --yes pnpm@12.4.1 exec vite dev --host --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
