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

test("the spinning record stops for anyone who asked for less motion", async ({ page }) => {
  // page.emulateMedia, not test.use({ reducedMotion }): the fixture option did not
  // reach the browser here — matchMedia kept reporting no-preference, so the test
  // was green-by-accident territory. This call is verified below before asserting.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const pediuMenosMovimento = await page.evaluate(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  expect(pediuMenosMovimento, "emulation did not reach the page").toBe(true);

  const disco = page.locator(".gira").first();
  await expect(disco).toBeAttached();
  expect(await disco.evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
});

test("and it does spin for everyone else", async ({ page }) => {
  // The mirror case. Without it, the test above passes even if the animation was
  // never wired up at all.
  // null resets the override to the browser default, which reports no-preference.
  // Emulating "no-preference" explicitly does NOT make the media query match here.
  await page.emulateMedia({ reducedMotion: null });
  await page.goto("/");

  const semPreferencia = await page.evaluate(
    () => matchMedia("(prefers-reduced-motion: no-preference)").matches,
  );
  expect(semPreferencia, "browser is not reporting no-preference").toBe(true);

  const disco = page.locator(".gira").first();
  expect(await disco.evaluate((el) => getComputedStyle(el).animationName)).toBe("gira");
});
