import { defineConfig } from "@playwright/test";

/**
 * The static export's own config, separate from playwright.config.ts on purpose.
 *
 * The main config boots `pnpm dev` and drives a browser. This suite does neither: it
 * reads the `out/` directory that `next build` wrote and checks the contract GitHub
 * Pages imposes — the site lives under /barvinil, not at the root of a domain. That
 * is a filesystem assertion, so no webServer and no browser projects here.
 *
 * Run it through `pnpm test:export`, which builds with the base path first.
 */
export default defineConfig({
  testDir: "./tests",
  testMatch: "export.spec.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "github" : "list",
});
