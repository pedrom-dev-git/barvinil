import { test, expect, type Page } from "@playwright/test";

/**
 * Sections arrive as the page is scrolled instead of being there all along.
 *
 * They arrive by moving, never by fading: text at opacity 0 has no contrast at
 * all, and axe is right to fail it. So nothing here is ever invisible, and most
 * of this file guards that floor — with motion refused, or with no JavaScript,
 * the page is simply all there, where it belongs.
 */

const deslocamento = (page: Page, sel: string) =>
  page.locator(sel).evaluate((el) => {
    const t = getComputedStyle(el).transform;
    return t === "none" ? 0 : new DOMMatrixReadOnly(t).m42;
  });

const opacidade = (page: Page, sel: string) =>
  page.locator(sel).evaluate((el) => Number(getComputedStyle(el).opacity));

const SECOES = ["casa", "fotos", "onde", "reservar"] as const;

test("uma seção abaixo da dobra entra quando chega a vez dela", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: null });
  await page.goto("/");

  // Far enough down that it has never been on screen. Polled, because the markup
  // arrives whole and the browser is what holds it back, once it has hydrated.
  await expect.poll(() => deslocamento(page, "section#onde")).toBeGreaterThan(8);

  await page.locator("section#onde").scrollIntoViewIfNeeded();
  await expect.poll(() => deslocamento(page, "section#onde")).toBe(0);
});

test("o que já está na tela não pisca", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: null });
  await page.goto("/");
  // The hero is what the guest is already looking at: it was never held back, so
  // it has nothing to arrive from.
  expect(await deslocamento(page, "section#hero")).toBe(0);
});

test("nenhuma seção fica invisível em momento nenhum", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: null });
  await page.goto("/");
  await expect.poll(() => deslocamento(page, "section#onde")).toBeGreaterThan(8);

  // Held back, and still fully painted: this is the line between an entrance and
  // a page that loses its own content.
  for (const id of SECOES) expect(await opacidade(page, `section#${id}`), id).toBe(1);
});

test("quem pediu menos movimento recebe a página inteira, de cara", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(
    await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches),
    "emulation did not reach the page",
  ).toBe(true);

  for (const id of SECOES) {
    expect(await deslocamento(page, `section#${id}`), id).toBe(0);
    expect(await opacidade(page, `section#${id}`), id).toBe(1);
  }
});

test.describe("sem JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("a página continua inteira", async ({ page }) => {
    await page.goto("/");
    for (const id of SECOES) {
      expect(await deslocamento(page, `section#${id}`), id).toBe(0);
      expect(await opacidade(page, `section#${id}`), id).toBe(1);
      await expect(page.locator(`section#${id}`)).toBeVisible();
    }
  });
});
