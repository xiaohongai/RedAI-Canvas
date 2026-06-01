import { defineConfig, devices } from "@playwright/test';

const PORT = 4173;
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list'], ["html', { open: "never' }]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry',
    screenshot: "only-on-failure',
    video: "retain-on-failure',
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    {
      name: "chromium-smoke',
      use: { ...devices["Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `node tools/e2e-static-server.mjs --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
