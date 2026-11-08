import { test, expect } from "./fixtures";
import type { Locator } from "@playwright/test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { site, preenchido } from "../content/site";

/**
 * Whether this checkout has a reel at all — a build-time fact, the same one
 * components/Hero.tsx decides on, and the same check tests/landing.spec.ts makes.
 *
 * It has to be answered off the disk and never off the page: FundoVideo is a client
 * component that mounts the <video> from an effect, so counting the element right
 * after goto() reads zero whether the file is missing or merely late — and a test
 * that skips itself on a race reports green having measured nothing.
 */
const temReel =
  preenchido(site.videoHero) &&
  existsSync(join(process.cwd(), "public", "video", site.videoHero.valor));

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
  //
  // Named, not taken as the first external link in the hero: the delivery pill is
  // the second one, and it IS filled, so whichever of the two `.first()` happened
  // to land on would decide whether this measured anything.
  const vazado = page.locator("section#hero").getByRole("link", { name: /cardápio/i });
  await expect(vazado).toBeVisible();
  expect(await contraste(vazado, "border-top-color")).toBeGreaterThanOrEqual(3);
});

test("o rótulo do botão de delivery se lê sobre o próprio vermelho (1.4.3, 4.5:1)", async ({
  page,
}) => {
  // This is the one measurement that decides which red the button may be, and it is
  // the reason the pill is not painted in iFood's own #EA1D2C: against that red the
  // house's areia sits at 3,88:1 and even pure white only reaches 4,46:1 — under the
  // floor for a 14px label. The red has to come down until areia clears 4,5:1.
  //
  // Measured against the element's own fill, not against what it sits on: `fundoDe`
  // deliberately starts at the parent, and for a filled button the parent is the
  // wrong surface — the label is read against the pill.
  const botao = page.locator("section#hero").getByRole("link", { name: /ifood/i });
  await expect(botao).toBeVisible();

  const [tinta, fundo] = await Promise.all([
    propriedade(botao, "color"),
    propriedade(botao, "background-color"),
  ]);
  expect(razao(cor(tinta), cor(fundo))).toBeGreaterThanOrEqual(4.5);
});

test("o ponto apagado do passa-fotos é visível (3:1)", async ({ page }) => {
  // The dots are the rail's stops, not its photos: when every photo already fits the
  // row there is no stop to show and no dot to measure. Asked of the rail and not of
  // the dots, because the dots are measured after hydration — counting them first
  // reads zero and skips a case the desktop very much has.
  const sobra = await page
    .locator("section#fotos [data-passa-fotos]")
    .evaluate((el) => el.scrollWidth - el.clientWidth);
  test.skip(sobra <= 1, "as fotos cabem todas na fileira: não há ponto");
  await expect(page.locator("section#fotos [data-ponto]").first()).toBeVisible();

  const apagado = page.locator('section#fotos [data-ponto]:not([aria-current="true"]) span').first();
  await expect(apagado).toBeAttached();
  expect(await contraste(apagado, "background-color")).toBeGreaterThanOrEqual(3);
});

/**
 * The type over the reel, measured off the pixels.
 *
 * Everything above reads computed colour, and computed colour is blind to a video:
 * the reel is pixels the @theme knows nothing about, and the scrim over it is a
 * gradient, so what the type is read against changes with the frame AND with how
 * far up the hero it sits. Nothing here can be derived — it has to be looked at.
 *
 * The type is taken off the screen first, so what is captured is exactly the
 * background it is read against, and each piece is held against the BRIGHTEST pixel
 * under it: light type on a light frame is the failure, never the average.
 */
test("o topo se lê sobre o reel, não sobre o tema (1.4.3 / 1.4.11)", async ({ page }) => {
  test.skip(!temReel, "sem reel neste checkout — não há o que compor");

  const video = page.locator("section#hero video");
  await expect(video).toBeAttached();
  await page.waitForFunction(() => {
    const v = document.querySelector<HTMLVideoElement>("section#hero video");
    return !!v && v.readyState >= 2 && v.videoWidth > 0;
  });

  // Floors are WCAG's: 4,5:1 for text under 24px, 3:1 for large type and for the
  // wordmark, which is a graphic that carries meaning (1.4.11).
  const alvos = [
    { nome: "CANOAS · RS", sel: "section#hero p:first-of-type", piso: 4.5 },
    { nome: "tagline", sel: "section#hero p.font-destaque", piso: 3 },
    // Only the outlined one is read against the reel. The delivery pill next to it
    // is opaque, so no frame ever reaches its label — what that label is read
    // against is the pill's own red, measured by computed colour further down.
    { nome: "botão vazado", sel: 'section#hero a:has-text("cardápio")', piso: 4.5 },
    { nome: "logotipo", sel: "section#hero h1", piso: 3 },
  ];

  const hero = await page.locator("section#hero").boundingBox();
  expect(hero, "o topo não está na página").not.toBeNull();

  const medidos: { nome: string; piso: number; tinta: RGBA; caixa: number[] }[] = [];
  for (const alvo of alvos) {
    const el = page.locator(alvo.sel).first();
    if ((await el.count()) === 0) continue;
    const caixa = await el.boundingBox();
    if (!caixa) continue;
    // The wordmark is an image and has no colour of its own; it is drawn in areia,
    // which is what body carries.
    const texto =
      alvo.nome === "logotipo"
        ? await page.locator("body").evaluate((el) => getComputedStyle(el).color)
        : await propriedade(el, "color");
    medidos.push({
      nome: alvo.nome,
      piso: alvo.piso,
      tinta: cor(texto),
      caixa: [caixa.x - hero!.x, caixa.y - hero!.y, caixa.width, caixa.height],
    });
  }
  expect(medidos.length, "nenhum texto do topo foi encontrado").toBeGreaterThan(0);

  await page.locator("section#hero .z-10").evaluate((el: HTMLElement) => {
    el.style.visibility = "hidden";
  });

  const duracao = await video.evaluate((v: HTMLVideoElement) => v.duration || 20);
  const pior = new Map(medidos.map((m) => [m.nome, Infinity]));

  for (const fracao of [0, 0.35, 0.7]) {
    await video.evaluate((v: HTMLVideoElement, t) => {
      v.pause();
      v.currentTime = t;
      return new Promise((pronto) => v.addEventListener("seeked", pronto, { once: true }));
    }, fracao * duracao);

    const png = (await page.locator("section#hero").screenshot()).toString("base64");
    const claros = await page.evaluate(
      async ({ png, caixas }) => {
        const img = new Image();
        img.src = `data:image/png;base64,${png}`;
        await img.decode();
        const cv = document.createElement("canvas");
        [cv.width, cv.height] = [img.width, img.height];
        const cx = cv.getContext("2d", { willReadFrequently: true })!;
        cx.drawImage(img, 0, 0);
        // The capture is in device pixels; the boxes came back in CSS pixels.
        const escala = img.width / document.querySelector("section#hero")!.clientWidth;
        const lum = (r: number, g: number, b: number) => {
          const f = (v: number) => {
            const s = v / 255;
            return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
          };
          return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
        };

        return caixas.map(([cx0, cy0, cw, ch]) => {
          const x = Math.max(0, Math.round(cx0 * escala));
          const y = Math.max(0, Math.round(cy0 * escala));
          const w = Math.min(img.width - x, Math.round(cw * escala));
          const h = Math.min(img.height - y, Math.round(ch * escala));
          if (w <= 0 || h <= 0) return null;
          const d = cx.getImageData(x, y, w, h).data;
          let claro: number[] | null = null;
          let maior = -1;
          for (let i = 0; i < d.length; i += 4) {
            const l = lum(d[i], d[i + 1], d[i + 2]);
            if (l > maior) {
              maior = l;
              claro = [d[i], d[i + 1], d[i + 2]];
            }
          }
          return claro;
        });
      },
      { png, caixas: medidos.map((m) => m.caixa) },
    );

    claros.forEach((px, i) => {
      if (!px) return;
      const m = medidos[i];
      const r = razao(m.tinta, { r: px[0], g: px[1], b: px[2], a: 1 });
      pior.set(m.nome, Math.min(pior.get(m.nome)!, r));
    });
  }

  for (const m of medidos) {
    expect
      .soft(pior.get(m.nome), `${m.nome} sobre o quadro mais claro do reel`)
      .toBeGreaterThanOrEqual(m.piso);
  }
});
