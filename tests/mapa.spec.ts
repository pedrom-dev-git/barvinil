import { test, expect } from "./fixtures";
import { site, preenchido } from "../content/site";
import { enderecoUmaLinha } from "../lib/maps";

/**
 * The map that stands where the list of links stood.
 *
 * "Where is this?" is the question #onde exists to answer, and an address in type
 * answers it only for someone who already knows the city. The square answers it for
 * everyone else.
 *
 * Two of these assertions exist because the a11y gate can no longer make them.
 * @axe-core/playwright recurses into cross-origin frames, so without
 * `.exclude("iframe")` the violations of Google's own markup would fail our suite —
 * a red run caused by code we cannot fix, changing whenever they deploy. Excluding
 * it also blinds axe to the <iframe> ELEMENT, `frame-title` included. So the title
 * and the absence of tabindex are checked here, by hand, on purpose.
 */

const MAPA = "section#onde iframe";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  // Scrolled into view first: the iframe is lazy, and nothing about it is settled
  // until the browser has had a reason to fetch it.
  await page.locator("section#onde").scrollIntoViewIfNeeded();
});

test("há exatamente um mapa em #onde", async ({ page }) => {
  await expect(page.locator(MAPA)).toHaveCount(1);
  await expect(page.locator("section#onde [data-mapa]")).toHaveCount(1);
});

test("o mapa aponta para o endereço que a página imprime", async ({ page }) => {
  test.skip(!preenchido(site.endereco), "sem endereço não há mapa");
  const e = site.endereco.valor!;

  const src = (await page.locator(MAPA).getAttribute("src"))!;
  expect(src).toMatch(/^https:\/\/www\.google\.com\/maps\?q=/);
  // The keyless embed form. It is free, which is what RNF09 needs, and undocumented,
  // which is why only its shape is asserted — if Google withdraws it, this test will
  // still pass and the square will be empty. "Ver no mapa" beside it is the link
  // that keeps working either way.
  expect(src).toContain("output=embed");
  expect(src).toContain("hl=pt-BR");

  // The query is the address the guest reads two inches away, encoded — not a second
  // source of truth free to drift from it.
  const q = decodeURIComponent(new URL(src).searchParams.get("q")!);
  expect(q).toBe(enderecoUmaLinha(e));
});

test("o mapa tem nome acessível, e não foi tirado da ordem de tabulação", async ({
  page,
}) => {
  // frame-title is wcag2a and serious, and it is one of the rules the axe exclusion
  // turned off for this element. An iframe with no title is "frame" to a screen
  // reader, in a section whose whole job is to say where the house is.
  const titulo = await page.locator(MAPA).getAttribute("title");
  expect(titulo?.trim(), "o iframe do mapa está sem title").toBeTruthy();
  expect(titulo).toMatch(/mapa/i);

  // frame-focusable-content, also wcag2a: tabindex="-1" is the usual reflex for
  // keeping a map out of the way of the keyboard, and it strands whatever is
  // focusable inside the frame — reachable by nothing.
  expect(await page.locator(MAPA).getAttribute("tabindex")).toBeNull();
});

test("o mapa não é buscado antes de a seção chegar perto", async ({ page }) => {
  // RNF03 asks for under 3s on 4G, and this is a third-party document in the fourth
  // section. `lazy` is what reconciles "it loads on its own, without a click" with
  // not paying for it on arrival.
  expect(await page.locator(MAPA).getAttribute("loading")).toBe("lazy");
  // The page's URL is not Google's business. Asserted as present-and-restrictive
  // rather than as an exact string: `no-referrer` and `no-referrer-when-downgrade`
  // are both defensible, a missing attribute is not.
  expect(await page.locator(MAPA).getAttribute("referrerpolicy")).toMatch(/no-referrer/);
});

test("o mapa carrega sozinho, sem clique", async ({ page }) => {
  // The decision was that it shows itself. So the frame has to be attached and
  // navigated with nobody having touched anything — with the stub from fixtures.ts
  // standing in for Google, which is also what proves the stub reaches the iframe.
  const frame = page.frameLocator(MAPA);
  await expect(frame.locator("body")).toBeAttached({ timeout: 10_000 });
});

test("o quadrado é quadrado, nas duas larguras", async ({ page }) => {
  const caixa = (await page.locator(MAPA).boundingBox())!;
  expect(Math.abs(caixa.width - caixa.height), `${caixa.width}x${caixa.height}`).toBeLessThanOrEqual(
    1,
  );
});
