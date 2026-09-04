import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/** RNF07: contrast and keyboard navigation to WCAG AA. */
test("no WCAG A/AA violations on the landing page", async ({ page }) => {
  await page.goto("/");

  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  expect(
    violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(" | ")}`),
  ).toEqual([]);
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the spinning record stops for anyone who asked for less motion", async ({ page }) => {
    await page.goto("/");

    const disco = page.locator(".gira").first();
    await expect(disco).toBeAttached();

    const animacao = await disco.evaluate((el) => getComputedStyle(el).animationName);
    expect(animacao).toBe("none");
  });
});
