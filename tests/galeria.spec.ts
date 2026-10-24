import { test, expect, type Page } from "@playwright/test";

/**
 * The gallery as a slideshow that advances on its own — what the owner asked for
 * (etapa3-intervencao/insumos-apresentacao.md §3, "passa-fotos automático").
 *
 * Scroll position is the single source of truth here: the rail is a snap container,
 * one frame per view, and the lit dot is derived from where the rail sits. So these
 * tests assert the dot, and the rail's scrollLeft where the dot alone could lie.
 */

const TRILHO = "section#fotos [data-passa-fotos]";
const PONTO = "section#fotos [data-ponto]";

/** Index of the frame the rail is showing, as the lit dot reports it. */
const aceso = (page: Page) =>
  page.locator(`${PONTO}[aria-current="true"]`).getAttribute("data-ponto");

const rolagem = (page: Page) => page.locator(TRILHO).evaluate((el) => el.scrollLeft);

const quadros = (page: Page) => page.locator(PONTO).count();

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(TRILHO)).toBeVisible();
});

test("the slideshow moves to the next photo on its own", async ({ page }) => {
  expect(await aceso(page)).toBe("0");

  await expect.poll(() => aceso(page), { timeout: 12_000 }).toBe("1");
  // The dot could light up while the rail stayed put, and the visitor would see
  // the same photo with a different dot under it.
  expect(await rolagem(page)).toBeGreaterThan(0);
});

test("after the last photo it comes back to the first", async ({ page }) => {
  // Watched, not touched: pressing a dot would hand the rail to the guest and the
  // clock would stop, which is the point of the next test but not of this one.
  test.setTimeout(60_000);
  const n = await quadros(page);

  for (let i = 1; i < n; i++) {
    await expect.poll(() => aceso(page), { timeout: 12_000 }).toBe(String(i));
  }
  await expect.poll(() => aceso(page), { timeout: 12_000 }).toBe("0");
});

test("it stops for anyone who asked for less motion", async ({ page }) => {
  // Same shape as a11y.spec.ts: emulation is verified before anything is asserted,
  // or a green here means nothing.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const pediuMenosMovimento = await page.evaluate(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  expect(pediuMenosMovimento, "emulation did not reach the page").toBe(true);

  await page.waitForTimeout(7000);
  expect(await aceso(page)).toBe("0");
  expect(await rolagem(page)).toBe(0);
});

test("it waits while the visitor is looking at a photo", async ({ page }) => {
  await page.locator(TRILHO).hover();
  await page.waitForTimeout(7000);
  expect(await aceso(page)).toBe("0");
});

test("the dots go straight to a photo", async ({ page }) => {
  await page.locator('[data-ponto="1"]').click();
  await expect.poll(() => aceso(page)).toBe("1");
  expect(await rolagem(page)).toBeGreaterThan(0);

  await page.locator('[data-ponto="0"]').click();
  await expect.poll(() => aceso(page)).toBe("0");
  await expect.poll(() => rolagem(page)).toBe(0);
});

test("swiping by hand lights the dot of the frame it landed on", async ({ page }) => {
  const n = await quadros(page);
  // What is under test is the dot following the rail, so the clock is held still
  // first: a tick landing mid-swipe would be testing two things at once.
  await page.locator(TRILHO).hover();
  await page
    .locator(TRILHO)
    .evaluate((el, i) => el.scrollTo({ left: el.clientWidth * i, behavior: "instant" }), n - 1);

  await expect.poll(() => aceso(page)).toBe(String(n - 1));
});

test("one photo fills the frame, one frame at a time", async ({ page }) => {
  const { largura, visivel, total, molduras } = await page.locator(TRILHO).evaluate((el) => ({
    largura: (el.firstElementChild as HTMLElement).getBoundingClientRect().width,
    visivel: el.clientWidth,
    total: el.scrollWidth,
    molduras: el.children.length,
  }));

  // A frame is exactly one view wide, and there is no gap between frames: the lit
  // dot is scrollLeft / clientWidth, and a gap would make that arithmetic a lie.
  expect(largura).toBeCloseTo(visivel, 0);
  expect(total).toBeCloseTo(visivel * molduras, 0);
});

test("the slideshow does not make the page scroll sideways", async ({ page }) => {
  const estouro = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(estouro).toBeLessThanOrEqual(0);
});
