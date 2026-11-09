import { test, expect } from "./fixtures";
import { site } from "../content/site";

/**
 * The two rooms, standing where the manifesto ends.
 *
 * #casa was four paragraphs of prose and two cards, and the reader fell from "Existimos
 * para quem sabe o valor de ouvir – e de sentir." straight into "A cozinha". The
 * paragraph just above claims a 1940s house with blue wooden windows and an iron
 * balcony, and until now that was something the page asserted and never showed.
 *
 * They are NOT the gallery. #fotos is a rail of square-ish frames that passes by
 * itself; these two are fixed, they keep their own shapes, and they belong to the
 * section's argument rather than to a slideshow. The spec guards that separation in
 * both directions, because the cheapest way for this to rot is for someone to "tidy
 * up" by moving them into site.fotos.
 */

const AMBIENTES = "section#casa [data-ambientes]";
const esperadas = site.ambientes.valor!;

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("as duas fotos estão em #casa, na ordem e com o alt do content/site.ts", async ({
  page,
}) => {
  const imagens = page.locator(`${AMBIENTES} img`);
  await expect(imagens).toHaveCount(esperadas.length);

  for (const [i, foto] of esperadas.entries()) {
    // The alt is the only thing on the page that describes a photograph to someone
    // who cannot see it, and it is the one part of a photo that can silently stop
    // matching what the file shows. Tied to the content store, not retyped here.
    await expect(imagens.nth(i)).toHaveAttribute("alt", foto.alt);
    await expect(imagens.nth(i)).toHaveAttribute(
      "src",
      new RegExp(`/fotos/${foto.arquivo!.replace(".", "\\.")}$`),
    );
  }
});

test("as duas fotos não entraram na galeria", async ({ page }) => {
  // The separation, asserted from the other side. site.fotos still owes `fachada` and
  // `salao`, and `salao` is literally "o salão à noite" — so the pull to wire one of
  // these into that slot is real, and it would put the same photograph on the page
  // twice.
  for (const foto of esperadas) {
    await expect(
      page.locator(`section#fotos img[src*="${foto.arquivo}"]`),
      `${foto.arquivo} apareceu na galeria`,
    ).toHaveCount(0);
  }
});

test("o bloco ocupa a largura da seção, alinhado com o título", async ({ page }) => {
  // Full width of the section's container, like the heading and the cards — not the
  // narrow max-w-prose of the manifesto it follows. 2px of slack for the frames' own
  // borders.
  const bloco = (await page.locator(AMBIENTES).boundingBox())!;
  const titulo = (await page.locator("section#casa h2").boundingBox())!;

  expect(Math.abs(bloco.x - titulo.x), "o bloco não começa na margem da seção").toBeLessThanOrEqual(
    2,
  );
  expect(bloco.width).toBeGreaterThanOrEqual(titulo.width - 2);
});

test("as duas fotos fecham na mesma altura, lado a lado", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "lado a lado é coisa de tela larga");

  // The whole reason the columns are proportional instead of equal: one photo is
  // landscape and the other portrait, so equal columns would end at different heights
  // and leave a step. 1.78 is (4/3) ÷ (3/4) — the ratio that makes the two bottoms
  // meet without a fixed height and without cropping either one.
  const caixas = await page.locator(`${AMBIENTES} img`).evaluateAll((imgs) =>
    imgs.map((el) => {
      const b = el.getBoundingClientRect();
      return { x: b.x, y: b.y, w: b.width, h: b.height };
    }),
  );
  expect(caixas).toHaveLength(2);
  const [salao, terraco] = caixas;

  expect(Math.abs(salao.h - terraco.h), "as duas fotos terminam em alturas diferentes").toBeLessThanOrEqual(
    2,
  );
  expect(Math.abs(salao.y - terraco.y), "as duas fotos não começam na mesma linha").toBeLessThanOrEqual(
    2,
  );
  expect(terraco.x, "a segunda foto não está à direita da primeira").toBeGreaterThan(salao.x);

  // Each one keeps its own shape. If this fails the photos are being cropped to a
  // common frame, which is what the whole arrangement exists to avoid: the blue window
  // runs the full width of the first one.
  expect(salao.w / salao.h, "a foto do salão deixou de ser 4:3").toBeCloseTo(4 / 3, 1);
  expect(terraco.w / terraco.h, "a foto do terraço deixou de ser 3:4").toBeCloseTo(3 / 4, 1);
});

test("no celular as duas empilham, em largura cheia", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "empilhar é coisa de tela estreita");

  const caixas = await page.locator(`${AMBIENTES} img`).evaluateAll((imgs) =>
    imgs.map((el) => {
      const b = el.getBoundingClientRect();
      return { x: b.x, y: b.y, w: b.width, h: b.height };
    }),
  );
  expect(caixas).toHaveLength(2);
  const [salao, terraco] = caixas;

  expect(Math.abs(salao.x - terraco.x), "as duas não estão na mesma coluna").toBeLessThanOrEqual(1);
  expect(terraco.y, "a segunda foto não está abaixo da primeira").toBeGreaterThanOrEqual(
    salao.y + salao.h,
  );
  expect(salao.w / salao.h).toBeCloseTo(4 / 3, 1);
  expect(terraco.w / terraco.h).toBeCloseTo(3 / 4, 1);
});

test("o bloco respira entre o manifesto e os cartões", async ({ page }) => {
  // The failure a reader sees before naming it: a photograph welded to the line above
  // it, or floating so far from it that the section looks like it broke in two. Same
  // guard the map band carries in tests/mapa.spec.ts, for the same reason — nothing
  // else in the suite measures vertical rhythm.
  const { acima, abaixo } = await page.locator("section#casa").evaluate((secao) => {
    const bloco = secao.querySelector("[data-ambientes]")!.getBoundingClientRect();
    const manifesto = secao.querySelectorAll("p");
    const ultimoTexto = manifesto[manifesto.length - 1].getBoundingClientRect();
    const cartoes = secao.querySelector("dl")!.getBoundingClientRect();
    return { acima: bloco.top - ultimoTexto.bottom, abaixo: cartoes.top - bloco.bottom };
  });

  expect(acima, "o bloco encostou no manifesto").toBeGreaterThanOrEqual(16);
  expect(acima, "o bloco descolou do manifesto").toBeLessThanOrEqual(80);
  expect(abaixo, "o bloco encostou nos cartões").toBeGreaterThanOrEqual(16);
  expect(abaixo, "o bloco descolou dos cartões").toBeLessThanOrEqual(80);
});
