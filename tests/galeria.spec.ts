import { test, expect, type Page } from "@playwright/test";

/**
 * The gallery as a slideshow that advances on its own — what the owner asked for
 * (etapa3-intervencao/insumos-apresentacao.md §3, "passa-fotos automático").
 *
 * Scroll position is the single source of truth here: the rail is a snap container
 * and the lit dot is derived from where the rail sits. So these tests assert the
 * dot, and the rail's scrollLeft where the dot alone could lie.
 *
 * How many photos stand side by side is the viewport's business: one on the phone,
 * up to three on a desktop. Below that count there is nothing to pass — the photos
 * are all on screen already — and the tests that drive the passing say so and skip,
 * rather than pinning a photo count the house has not finished delivering.
 */

const TRILHO = "section#fotos [data-passa-fotos]";
const PONTO = "section#fotos [data-ponto]";

/** Index of the frame the rail is showing, as the lit dot reports it. */
const aceso = (page: Page) =>
  page.locator(`${PONTO}[aria-current="true"]`).getAttribute("data-ponto");

const rolagem = (page: Page) => page.locator(TRILHO).evaluate((el) => el.scrollLeft);

/** Dots, which are the positions the rail stops at — not the photos. */
const paradas = (page: Page) => page.locator(PONTO).count();

/** What is out of view, in pixels. Zero when every photo already fits the row. */
const sobra = (page: Page) =>
  page.locator(TRILHO).evaluate((el) => el.scrollWidth - el.clientWidth);

/** Guards the tests that drive the passing: with nothing out of view, there is none. */
async function comOQuePassar(page: Page) {
  test.skip((await sobra(page)) <= 1, "as fotos cabem todas na fileira: não há o que passar");
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(TRILHO)).toBeVisible();
});

test("the slideshow moves to the next photo on its own", async ({ page }) => {
  await comOQuePassar(page);
  expect(await aceso(page)).toBe("0");

  await expect.poll(() => aceso(page), { timeout: 12_000 }).toBe("1");
  // The dot could light up while the rail stayed put, and the visitor would see
  // the same photo with a different dot under it.
  expect(await rolagem(page)).toBeGreaterThan(0);
});

test("after the last photo it comes back to the first", async ({ page }) => {
  await comOQuePassar(page);
  // Watched, not touched: pressing a dot would hand the rail to the guest and the
  // clock would stop, which is the point of the next test but not of this one.
  test.setTimeout(60_000);
  const n = await paradas(page);

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
  await comOQuePassar(page);
  const pediuMenosMovimento = await page.evaluate(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  expect(pediuMenosMovimento, "emulation did not reach the page").toBe(true);

  await page.waitForTimeout(7000);
  expect(await aceso(page)).toBe("0");
  expect(await rolagem(page)).toBe(0);
});

test("it waits while the visitor is looking at a photo", async ({ page }) => {
  await comOQuePassar(page);
  await page.locator(TRILHO).hover();
  await page.waitForTimeout(7000);
  expect(await aceso(page)).toBe("0");
});

test("the dots go straight to a photo", async ({ page }) => {
  await comOQuePassar(page);
  await page.locator('[data-ponto="1"]').click();
  await expect.poll(() => aceso(page)).toBe("1");
  expect(await rolagem(page)).toBeGreaterThan(0);

  await page.locator('[data-ponto="0"]').click();
  await expect.poll(() => aceso(page)).toBe("0");
  await expect.poll(() => rolagem(page)).toBe(0);
});

test("swiping by hand lights the dot of the frame it landed on", async ({ page }) => {
  await comOQuePassar(page);
  const n = await paradas(page);
  // What is under test is the dot following the rail, so the clock is held still
  // first: a tick landing mid-swipe would be testing two things at once.
  await page.locator(TRILHO).hover();
  await page
    .locator(TRILHO)
    .evaluate((el) => el.scrollTo({ left: el.scrollWidth - el.clientWidth, behavior: "instant" }));

  await expect.poll(() => aceso(page)).toBe(String(n - 1));
});

test("an empty frame never rides along with the photos", async ({ page }) => {
  // In a slideshow an empty frame is not texture beside two photos: it is a frame
  // of nothing the clock walks the guest into, looking like an image that failed
  // to load. The groove frame is for having no photos at all.
  const fotos = await page.locator("section#fotos li img").count();
  const molduras = await page.locator("section#fotos li").count();

  expect(molduras).toBe(fotos || 3);
});

test("the row fills the width, one photo on a phone and up to three on a desktop", async ({
  page,
}, testInfo) => {
  const { molduras, visivel, largura, total, vao } = await page.locator(TRILHO).evaluate((el) => {
    const filhos = Array.from(el.children) as HTMLElement[];
    return {
      molduras: filhos.length,
      visivel: el.clientWidth,
      largura: filhos[0].getBoundingClientRect().width,
      total: el.scrollWidth,
      vao: parseFloat(getComputedStyle(el).columnGap) || 0,
    };
  });

  // Three abreast is the ceiling, not the rule: with fewer photos than that the
  // frames widen to fill the row, so the house still owing four photos never shows
  // as a hole where the rest would go.
  const colunas = testInfo.project.name === "mobile" ? 1 : Math.min(3, molduras);

  expect(largura).toBeCloseTo((visivel - vao * (colunas - 1)) / colunas, 0);
  expect(total).toBeCloseTo(largura * molduras + vao * (molduras - 1), 0);
});

test("the rail is as wide as the section it sits in", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "é a largura do desktop que estava errada");

  // The rail used to be capped at 384px with no centring, so on a desktop it sat in
  // the left corner of a 896px section with half the row empty beside it.
  const trilho = await page.locator(TRILHO).boundingBox();
  const titulo = await page.locator("section#fotos h2").boundingBox();
  expect(trilho, "o trilho não está na página").not.toBeNull();
  expect(titulo, "o título da seção não está na página").not.toBeNull();

  expect(trilho!.x).toBeCloseTo(titulo!.x, 0);
  expect(trilho!.width).toBeCloseTo(titulo!.width, 0);
});

test("the slideshow does not make the page scroll sideways", async ({ page }) => {
  const estouro = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(estouro).toBeLessThanOrEqual(0);
});
