import { test, expect, type Page } from "@playwright/test";

/**
 * Sections arrive as the page is scrolled instead of being there all along.
 *
 * The whole risk of this kind of thing is a page that hides its own content when
 * the enhancement does not run, so that is what most of this file is about: with
 * motion refused, or with no JavaScript at all, nothing may ever be invisible.
 */

const opacidade = (page: Page, sel: string) =>
  page.locator(sel).evaluate((el) => Number(getComputedStyle(el).opacity));

const SECOES = ["casa", "fotos", "onde", "reservar"] as const;

test("uma seção abaixo da dobra entra quando chega a vez dela", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: null });
  await page.goto("/");

  // Far enough down that it has never been on screen.
  expect(await opacidade(page, "section#onde")).toBeLessThan(0.5);

  await page.locator("section#onde").scrollIntoViewIfNeeded();
  await expect.poll(() => opacidade(page, "section#onde")).toBe(1);
});

test("o que já está na tela não pisca", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: null });
  await page.goto("/");
  // The hero is what the guest is already looking at: it was never hidden, so it
  // has nothing to fade in from.
  expect(await opacidade(page, "section#hero")).toBe(1);
});

test("quem pediu menos movimento recebe a página inteira, de cara", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(
    await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches),
    "emulation did not reach the page",
  ).toBe(true);

  for (const id of SECOES) expect(await opacidade(page, `section#${id}`), id).toBe(1);
});

test.describe("sem JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("a página continua inteira", async ({ page }) => {
    await page.goto("/");
    for (const id of SECOES) {
      expect(await opacidade(page, `section#${id}`), id).toBe(1);
      await expect(page.locator(`section#${id}`)).toBeVisible();
    }
  });
});
