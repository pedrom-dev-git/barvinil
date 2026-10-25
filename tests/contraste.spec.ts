import { test, expect, type Locator } from "@playwright/test";

/**
 * RNF07 asks for WCAG AA, and axe reports the page clean — but axe does not check
 * 1.4.11 on a border, and it does not check 1.4.3 on text it considers decorative.
 * That is where this page was failing: the solid tones of the @theme are fine and
 * documented, and nobody had ever measured what happens once an opacity is put on
 * them. The furniture — field borders, hints, the slideshow's dots — was sitting
 * between 1,3:1 and 2,9:1, which is why the page read as text floating in green.
 */

type RGBA = { r: number; g: number; b: number; a: number };

/** linear-light channel → the 0–255 sRGB byte that lands in the framebuffer. */
const aByte = (v: number) =>
  Math.max(0, Math.min(255, (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055) * 255));

/**
 * Parses what getComputedStyle hands back. Tailwind 4 writes every opacity as a
 * color-mix in oklab, and Chrome resolves it to `oklab(L a b / α)` — not to rgba —
 * so a parser that only reads numbers out of the string would take L for red and
 * report a near-black colour that fails everything for the wrong reason.
 */
function cor(texto: string): RGBA {
  const [x, y, z, a = 1] = texto.match(/-?[\d.]+(?=[\s,)/])|-?[\d.]+$/g)?.map(Number) ?? [];

  if (texto.startsWith("oklab(")) {
    const l = (x + 0.3963377774 * y + 0.2158037573 * z) ** 3;
    const m = (x - 0.1055613458 * y - 0.0638541728 * z) ** 3;
    const s = (x - 0.0894841775 * y - 1.291485548 * z) ** 3;
    return {
      r: aByte(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
      g: aByte(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
      b: aByte(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
      a,
    };
  }
  // `color(srgb …)` carries 0–1 channels; rgb()/rgba() carry bytes.
  const escala = texto.startsWith("color(") ? 255 : 1;
  return { r: x * escala, g: y * escala, b: z * escala, a };
}

/** The colour that ends up on screen once a translucent one is laid over a solid. */
function sobre(frente: RGBA, fundo: RGBA): RGBA {
  const m = (f: number, t: number) => f * frente.a + t * (1 - frente.a);
  return { r: m(frente.r, fundo.r), g: m(frente.g, fundo.g), b: m(frente.b, fundo.b), a: 1 };
}

function luminancia({ r, g, b }: RGBA): number {
  const c = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
}

function razao(frente: RGBA, fundo: RGBA): number {
  const [a, b] = [luminancia(sobre(frente, fundo)), luminancia(fundo)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

/** The solid colour painted behind an element, walking up past transparent ancestors. */
const fundoDe = (l: Locator) =>
  l.evaluate((el) => {
    // Starts at the parent: an element's own fill is what we are measuring, not
    // what it sits on.
    for (let e: Element | null = el.parentElement; e; e = e.parentElement) {
      const c = getComputedStyle(e).backgroundColor;
      if (c && !c.includes("rgba(0, 0, 0, 0)") && c !== "transparent") return c;
    }
    return getComputedStyle(document.body).backgroundColor;
  });

const propriedade = (l: Locator, p: string) =>
  l.evaluate((el, prop) => getComputedStyle(el).getPropertyValue(prop), p);

async function contraste(alvo: Locator, prop: string): Promise<number> {
  const [frente, fundo] = await Promise.all([propriedade(alvo, prop), fundoDe(alvo)]);
  return razao(cor(frente), cor(fundo));
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test.describe("o formulário de reserva", () => {
  test.beforeEach(async ({ page }) => {
    const s = page.locator("section#reservar");
    await s.scrollIntoViewIfNeeded();
    await s.getByRole("button", { name: /reservar mesa/i }).click();
    await expect(s.getByLabel(/data/i)).toBeVisible();
  });

  test("a borda dos campos é visível (1.4.11, 3:1)", async ({ page }) => {
    const campos = page.locator("section#reservar form").locator("select, input[type='number']");
    const total = await campos.count();
    expect(total).toBeGreaterThan(0);

    for (let i = 0; i < total; i++) {
      expect(await contraste(campos.nth(i), "border-top-color")).toBeGreaterThanOrEqual(3);
    }
  });

  test("a dica de data e a de hora são texto legível (1.4.3, 4.5:1)", async ({ page }) => {
    const s = page.locator("section#reservar");
    expect(await contraste(s.locator("[data-data-extenso]"), "color")).toBeGreaterThanOrEqual(4.5);
    expect(await contraste(s.getByLabel(/hora/i), "color")).toBeGreaterThanOrEqual(4.5);
    expect(await contraste(s.locator("[data-dica-hora]"), "color")).toBeGreaterThanOrEqual(4.5);
  });
});

test("a borda do botão vazado é visível (1.4.11, 3:1)", async ({ page }) => {
  // "Ver cardápio" is a button, and a button's boundary is the whole of what says
  // it is one — there is no fill to fall back on.
  const vazado = page.locator("section#hero a[target='_blank']").first();
  await expect(vazado).toBeVisible();
  expect(await contraste(vazado, "border-top-color")).toBeGreaterThanOrEqual(3);
});

test("o ponto apagado do passa-fotos é visível (3:1)", async ({ page }) => {
  const apagado = page.locator('section#fotos [data-ponto]:not([aria-current="true"]) span').first();
  await expect(apagado).toBeAttached();
  expect(await contraste(apagado, "background-color")).toBeGreaterThanOrEqual(3);
});
