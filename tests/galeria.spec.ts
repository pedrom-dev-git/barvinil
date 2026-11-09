import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";

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

/**
 * A frame that is a photograph.
 *
 * The rail will carry a lap of clones at its tail, so that every photo can reach the
 * left edge and the loop never has to rewind. A clone is a copy of a frame, marked
 * `data-clone`, hidden from assistive technology, and counted by nothing: anything in
 * this suite that means "the photos" has to say so, or it will quietly start counting
 * the lap as well and pass while measuring nothing.
 */
const MOLDURA = "section#fotos li:not([data-clone])";

/** Index of the frame the rail is showing, as the lit dot reports it. */
const aceso = (page: Page) =>
  page.locator(`${PONTO}[aria-current="true"]`).getAttribute("data-ponto");

const rolagem = (page: Page) => page.locator(TRILHO).evaluate((el) => el.scrollLeft);

/** Dots, which are the positions the rail stops at — not the photos. */
const paradas = (page: Page) => page.locator(PONTO).count();

const reais = (page: Page) => page.locator(MOLDURA).count();

/**
 * How many frames stand side by side in the row, measured off the laid-out rail.
 *
 * The step is read as the distance between two frames' left edges rather than from
 * the width plus the gap: it is one number instead of two, and it cannot drift by a
 * fractional pixel at a breakpoint.
 */
const colunas = (page: Page) =>
  page.locator(TRILHO).evaluate((el) => {
    const filhos = Array.from(el.children) as HTMLElement[];
    if (filhos.length < 2) return filhos.length;
    const passo = filhos[1].offsetLeft - filhos[0].offsetLeft;
    const vao = parseFloat(getComputedStyle(el).columnGap) || 0;
    return Math.round((el.clientWidth + vao) / passo);
  });

/**
 * Guards the tests that drive the passing: with every photo already in the row, there
 * is nothing to pass.
 *
 * Asked of the photographs and the row, never of `scrollWidth - clientWidth`. Once the
 * rail carries a lap of clones there is ALWAYS something out of view — the clones are
 * what is out of view — so that subtraction stops answering this question and starts
 * answering a different one, while still looking right.
 */
async function comOQuePassar(page: Page) {
  test.skip(
    (await colunas(page)) >= (await reais(page)),
    "as fotos cabem todas na fileira: não há o que passar",
  );
  // The dots are measured off the laid-out rail, so they arrive with hydration and
  // not with the HTML. Counting them before that reads zero and tests nothing.
  await expect(page.locator(PONTO).first()).toBeVisible();
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
  // The last PHOTOGRAPH, not the last stop. They were different things while the rail
  // ran out of travel three frames in and the last photos shared one resting place —
  // a dot for a photo nobody could reach would have been a control that lies, so the
  // dots counted stops instead. The lap of clones ends that: every photograph gets to
  // the left edge, so every photograph gets a dot of its own.
  const n = await reais(page);
  // What is under test is the dot following the rail, so the clock is held still
  // first: a tick landing mid-swipe would be testing two things at once.
  await page.locator(TRILHO).hover();
  // To the last PHOTOGRAPH's resting place, clamped — not to the end of the travel.
  // The two are the same thing only while the rail ends at the last photo; with a lap
  // of clones behind it, the end of the travel is a copy of the first frame, and a
  // test that aims there stops being about a hand landing on the last photo.
  await page.locator(TRILHO).evaluate((el) => {
    const fotos = el.querySelectorAll("li:not([data-clone])");
    const ultima = fotos[fotos.length - 1] as HTMLElement;
    el.scrollTo({
      left: Math.min(ultima.offsetLeft, el.scrollWidth - el.clientWidth),
      behavior: "instant",
    });
  });

  await expect.poll(() => aceso(page)).toBe(String(n - 1));
});

test("an empty frame never rides along with the photos", async ({ page }) => {
  // In a slideshow an empty frame is not texture beside two photos: it is a frame
  // of nothing the clock walks the guest into, looking like an image that failed
  // to load. The groove frame is for having no photos at all.
  const fotos = await page.locator(`${MOLDURA} img`).count();
  const molduras = await page.locator(MOLDURA).count();

  expect(molduras).toBe(fotos || 3);

  // And no clone is empty either. A clone of a groove frame would be a frame of
  // nothing that the guest cannot even reach a dot for.
  const clonesVazios = await page
    .locator("section#fotos li[data-clone]")
    .evaluateAll((lis) => lis.filter((li) => !li.querySelector("img")).length);
  expect(clonesVazios, "há clone sem foto dentro").toBe(0);
});

test("a lista que um leitor de tela ouve tem uma foto por foto", async ({ page }) => {
  // The rail is a <ul>, so what assistive technology hears is a list with a length.
  // The lap of clones must not be in it — a guest hearing "list, 8 items" over five
  // photographs is being told the house has more rooms than it has.
  const naLista = await page.locator(TRILHO).getByRole("listitem").count();
  expect(naLista, "a lista acessível não bate com as fotos").toBe(await reais(page));
});

test("the row fills the width, one photo on a phone and up to three on a desktop", async ({
  page,
}, testInfo) => {
  const { molduras, filhos, visivel, largura, total, vao } = await page
    .locator(TRILHO)
    .evaluate((el) => {
      const filhos = Array.from(el.children) as HTMLElement[];
      return {
        molduras: el.querySelectorAll("li:not([data-clone])").length,
        filhos: filhos.length,
        visivel: el.clientWidth,
        largura: filhos[0].getBoundingClientRect().width,
        total: el.scrollWidth,
        vao: parseFloat(getComputedStyle(el).columnGap) || 0,
      };
    });

  // Three abreast is the ceiling, not the rule: with fewer photos than that the
  // frames widen to fill the row, so the house still owing four photos never shows
  // as a hole where the rest would go.
  const porFileira = testInfo.project.name === "mobile" ? 1 : Math.min(3, molduras);

  expect(largura).toBeCloseTo((visivel - vao * (porFileira - 1)) / porFileira, 0);
  // The travel is over every child, clones included — they are frames of the same
  // width sharing the same gap, and the rail has to account for them too.
  expect(total).toBeCloseTo(largura * filhos + vao * (filhos - 1), 0);
});

test("há um ponto por foto, e o rótulo diz a verdade", async ({ page }) => {
  await comOQuePassar(page);

  // On a desktop this was three dots over five photographs, and the aria-label said
  // "Foto 1 de 5" beside them — a control that could not reach what it was counting.
  // The loop makes every photograph reachable, so the two numbers become the same one.
  expect(await paradas(page), "pontos e fotos deixaram de bater").toBe(await reais(page));
  await expect(page.locator(PONTO).first()).toHaveAttribute(
    "aria-label",
    `Foto 1 de ${await reais(page)}`,
  );
});

test("o curso do trilho é exatamente uma volta", async ({ page }) => {
  await comOQuePassar(page);

  // The invariant the whole loop rests on. With a lap of clones as wide as the row,
  // the travel of the rail equals the distance of one lap — so the furthest the guest
  // can get is the first clone, and the teleport that brings them home is an exact
  // subtraction of one lap rather than a number that nearly fits.
  //
  // Measured three ways and tied together, because any two of them agreeing by
  // accident is how geometry tests rot.
  const { curso, volta, passo, fotos } = await page.locator(TRILHO).evaluate((el) => {
    const filhos = Array.from(el.children) as HTMLElement[];
    const n = el.querySelectorAll("li:not([data-clone])").length;
    return {
      curso: el.scrollWidth - el.clientWidth,
      volta: (filhos[n] as HTMLElement | undefined)?.offsetLeft ?? -1,
      passo: filhos[1].offsetLeft - filhos[0].offsetLeft,
      fotos: n,
    };
  });

  expect(volta, "não há clone depois da última foto").toBeGreaterThan(0);
  expect(volta, "uma volta não é o passo vezes o número de fotos").toBeCloseTo(passo * fotos, 0);
  expect(curso, "o curso do trilho não é uma volta exata").toBeCloseTo(volta, 0);
});

test("os clones não são fotos para quem usa leitor de tela", async ({ page }) => {
  await comOQuePassar(page);

  const clones = page.locator("section#fotos li[data-clone]");
  expect(await clones.count(), "o trilho não carrega volta nenhuma").toBeGreaterThan(0);

  // Hidden as a whole, and the image inside given an empty alt as well. The second is
  // redundant on purpose: if the aria-hidden is ever lost in a refactor, the copy
  // still does not read its neighbour's sentence out loud a second time. And
  // next/image requires an alt, so there is no third option.
  const escondidos = await clones.evaluateAll((lis) =>
    lis.filter((li) => li.getAttribute("aria-hidden") === "true").length,
  );
  expect(escondidos, "há clone visível para a árvore de acessibilidade").toBe(await clones.count());

  const alts = await clones.locator("img").evaluateAll((imgs) =>
    imgs.map((img) => img.getAttribute("alt")),
  );
  expect(alts.every((a) => a === ""), "clone com alt escrito").toBe(true);
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
