import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end smoke tests against a running site.
 *   pnpm dev   (or pnpm build && pnpm start)
 *   pnpm test:e2e                                  # http://localhost:3000
 *   BASE_URL=https://<preview>.vercel.app pnpm test:e2e
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120_000,
  fullyParallel: true,
  workers: 3,
  reporter: [["list"]],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    trace: "retain-on-failure",
    // Optional: point at an already-installed Chromium instead of `npx playwright install`.
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
