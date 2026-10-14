import { defineConfig, devices } from "@playwright/test";

/**
 * The presentation prints, in their own config — same reason export.spec.ts has one.
 *
 * It differs from playwright.config.ts in three ways that matter, and that is why it
 * is not a project in there:
 *
 *   - the projects are named `prints-*`, which is how prints.spec.ts knows a capture
 *     is wanted. Under the main config every shot skips, so `pnpm test:e2e` never
 *     writes outside the repo;
 *   - every shot is taken with reduced motion on (prints.spec.ts asks the page for
 *     it), so the booking panel is open or shut and never caught mid-transition;
 *   - one worker, serially: these are artifacts filed in order, not a race.
 *
 * Output goes to PIW_PRINTS_DIR, or ~/Desktop/media/piw-prints/<today>/. Outside both
 * git trees on purpose: the prints carry the house's photos, which are not ours to
 * commit.
 *
 * Run it with `pnpm prints`.
 */
export default defineConfig({
  testDir: "./tests",
  testMatch: "prints.spec.ts",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
  },
  projects: [
    {
      name: "prints-mobile",
      use: { ...devices["Pixel 5"], viewport: { width: 390, height: 844 } },
    },
    {
      name: "prints-desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    // Same call as the main config, same reason: a server already holding :3000 once
    // served a stale build, and the shots would have been of a page that no longer
    // exists in the source.
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
