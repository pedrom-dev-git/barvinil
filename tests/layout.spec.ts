import { test, expect, type Locator } from "@playwright/test";

/**
 * Geometry the eye reads as "crooked" before it can say why. Every assertion here
 * came out of a visual review of the live page on 2026-10-02.
 */

const esquerda = async (l: Locator) => (await l.boundingBox())!.x;

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("every section starts on the same left edge", async ({ page }) => {
  // The gallery used a wider container than the rest, so on a desktop its title
  // sat 128px left of every other section's.
  const bordas = await Promise.all(
    [
      page.locator("section#hero h1"),
      page.locator("section#casa h2"),
      page.locator("section#fotos h2"),
      page.locator("section#onde h2"),
    ].map(esquerda),
  );
  for (const x of bordas) expect(x).toBeCloseTo(bordas[0], 0);
});

test("the house's cards line up with the section title", async ({ page }) => {
  // The cards had a fill identical to the page, so only their padding showed: an
  // indent with no visible box to explain it.
  const titulo = await esquerda(page.locator("section#casa h2"));
  const primeiro = await esquerda(page.locator("section#casa dt").first());
  expect(primeiro).toBeCloseTo(titulo, 0);
});

test("the tagline never leaves a single word on its last line", async ({ page }) => {
  const tagline = page.locator("section#hero p.font-destaque");
  const [penultima, ultima] = await tagline.evaluate((p) => {
    const no = p.firstChild as Text;
    const texto = no.data.trimEnd();
    const fim = texto.lastIndexOf(" ");
    const inicio = texto.lastIndexOf(" ", fim - 1) + 1;
    const topo = (de: number, ate: number) => {
      const r = document.createRange();
      r.setStart(no, de);
      r.setEnd(no, ate);
      return r.getBoundingClientRect().top;
    };
    return [topo(inicio, fim), topo(fim + 1, texto.length)];
  });
  expect(ultima).toBeCloseTo(penultima, 0);
});

test("the contact list is as tall as its rows, with no empty tail", async ({ page }) => {
  // As a grid item it stretched to the address column's height, so its bottom
  // rule floated under an empty gap, as if a row were missing.
  const lista = page.locator("section#onde ul");
  const { total, linhas } = await lista.evaluate((ul) => ({
    total: ul.getBoundingClientRect().height,
    linhas: [...ul.children].reduce((s, li) => s + li.getBoundingClientRect().height, 0),
  }));
  expect(total - linhas).toBeLessThanOrEqual(3);
});

test("on a phone the next section peeks above the fold", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "the fold is a phone concern");
  // A full-height hero with its content centred left blank bands above and below
  // and nothing that says the page goes on.
  const topo = (await page.locator("section#casa").boundingBox())!.y;
  expect(topo).toBeLessThan(page.viewportSize()!.height);
});
