import { test, expect } from "./fixtures";
import { site, preenchido } from "../content/site";
import { enderecoUmaLinha } from "../lib/maps";

/**
 * The map that stands where the list of links stood.
 *
 * "Where is this?" is the question #onde exists to answer, and an address in type
 * answers it only for someone who already knows the city. The band answers it for
 * everyone else.
 *
 * The title and the absence of tabindex are asserted here even though axe also
 * checks them. They were going to be the hand-rolled replacement for an exclusion
 * that turned out to be unnecessary: axe does recurse into cross-origin frames, but
 * tests/fixtures.ts intercepts the iframe's own navigation, so what axe audits is
 * our own clean stub — measured, 55 passing with no exclusion anywhere. They stay
 * because this is the file that explains WHY the map needs them, and because the day
 * someone writes a spec that goes online on purpose, the right tool is
 * `setLegacyMode(true)` and not `.exclude()`, and these assertions are what makes
 * that switch safe.
 *
 * The `allow` assertion is the one property nothing else guards. The snippet
 * Google's own share dialog hands out carries `allow="fullscreen"`, and pasting it
 * over this markup would quietly hand the frame a permission it has no use for.
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
  // still pass and the band will be empty. "Ver no mapa" beside it is the link
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
  // frame-title is wcag2a and serious. An iframe with no title is announced as
  // "frame", in the one section whose whole job is to say where the house is.
  const titulo = await page.locator(MAPA).getAttribute("title");
  expect(titulo?.trim(), "o iframe do mapa está sem title").toBeTruthy();
  expect(titulo).toMatch(/mapa/i);

  // frame-focusable-content, also wcag2a: tabindex="-1" is the usual reflex for
  // keeping a map out of the way of the keyboard, and it strands whatever is
  // focusable inside the frame — reachable by nothing.
  expect(await page.locator(MAPA).getAttribute("tabindex")).toBeNull();
});

test("o mapa pede o mínimo do visitante e o mínimo do browser", async ({ page }) => {
  const mapa = page.locator(MAPA);

  // `lazy` is a hint, not a promise — measured, Chromium fetches this frame with
  // 2000px of page above it. Asserted anyway: it is the only chance RNF03 gets on a
  // slow phone, and dropping it would be a regression nobody would see.
  expect(await mapa.getAttribute("loading")).toBe("lazy");

  // The page's URL is not Google's business. Present-and-restrictive rather than an
  // exact string: `no-referrer` and `no-referrer-when-downgrade` are both
  // defensible, a missing attribute is not. It hides WHICH page; the site's origin
  // still reaches the frame through location.ancestorOrigins, and nothing in the
  // markup can stop that — which is what the footer notice is for.
  expect(await mapa.getAttribute("referrerpolicy")).toMatch(/no-referrer/);

  // No `allow`, so the default permissions policy denies the frame geolocation,
  // camera, microphone and the rest — verified behaviour, not an assumption. This
  // is the one security property no other test guards, and the snippet Google's own
  // share dialog hands out carries `allow`, so a paste would reintroduce it.
  expect(await mapa.getAttribute("allow"), "o mapa ganhou uma permissão").toBeNull();
  // `sandbox` is deliberately absent: the embed needs its own scripts and storage,
  // and the token set it actually requires is undocumented and moves. An offline
  // suite cannot tell a broken embed from a working one, so this is not the place
  // to guess at one.
  expect(await mapa.getAttribute("sandbox")).toBeNull();
});

test("o mapa carrega sozinho, sem clique", async ({ page }) => {
  // The decision was that it shows itself, so the frame has to have NAVIGATED with
  // nobody having touched anything.
  //
  // Asserted on the frame's URL, not on its <body>. The first version waited for a
  // body, and measured, an iframe with `src="about:blank"` has one — the test passed
  // over a map that was never fetched. A frame whose URL carries the embed form is
  // the only thing that says the browser actually went and got it.
  await expect
    .poll(() => page.frames().some((f) => f.url().includes("output=embed")), {
      timeout: 10_000,
    })
    .toBe(true);
});

test("a página diz ao visitante que o mapa vem do Google", async ({ page }) => {
  // Asserted in this file and not with the footer's other line, because the notice
  // exists because of the map: the day the band goes, this sentence goes with it,
  // and a test here is what ties the two together.
  //
  // Before this map the published page made no third-party request at all. It now
  // makes one on load, without being asked, and the visitor is the one it happens
  // to — so the sentence has to be somewhere they can read it. A line in the README
  // does not reach them.
  const aviso = page.locator("footer [data-aviso-terceiros]");
  await expect(aviso).toHaveCount(1);
  await expect(aviso).toContainText(/google/i);
  await expect(aviso).toContainText(/ip/i);
});

test("o mapa é uma faixa larga, e ocupa a seção de ponta a ponta", async ({
  page,
}, testInfo) => {
  // It was a 384px square in the right-hand column, and that was the whole problem:
  // the grid matched the left column to it, so the address — which ends 211px in —
  // sat over 170px of nothing. Measured before the change, on both viewports.
  //
  // As a band there is no second column to match, and the map gets the job it is
  // actually for: showing the block the house is on, which is wide, not tall.
  const moldura = (await page.locator("section#onde [data-mapa]").boundingBox())!;
  const titulo = (await page.locator("section#onde h2").boundingBox())!;

  const proporcao = moldura.width / moldura.height;
  const esperada = testInfo.project.name === "mobile" ? 4 / 3 : 3;
  expect(proporcao, `${Math.round(moldura.width)}x${Math.round(moldura.height)}`).toBeCloseTo(
    esperada,
    1,
  );

  // Full width of the section's column, aligned with the heading — not inset into
  // half of it. 2px of slack for the frame's own border.
  expect(Math.abs(moldura.x - titulo.x), "o mapa não começa na margem da seção").toBeLessThanOrEqual(
    2,
  );
  expect(moldura.width).toBeGreaterThanOrEqual(titulo.width - 2);
});

test("o vão entre o último texto e o mapa fica entre 16 e 80px", async ({ page }) => {
  // Named for what it measures, after the Rule 18 gate of 2026-11-09 pointed out that
  // "no empty column" is not what this asserts. It measures one vertical gap: the end
  // of the text block to the top of the band.
  //
  // That is still the right place to measure, because the old void lived there —
  // between the bottom of the address and the bottom of the square pinned beside it.
  // But what the number forbids is the band drifting away from the text or welding
  // itself to it, not a column: the band spans the section, so there is no second
  // column left to be empty. The shape of the layout is the business of the band test
  // above, and of layout.spec.ts.
  const { vaoAbaixoDoTexto } = await page.locator("section#onde").evaluate((secao) => {
    const mapa = secao.querySelector("[data-mapa]")!.getBoundingClientRect();
    const ultimo = secao.querySelector("a")!.getBoundingClientRect();
    return { vaoAbaixoDoTexto: mapa.top - ultimo.bottom };
  });
  expect(vaoAbaixoDoTexto, "vão entre o último texto e o mapa").toBeLessThanOrEqual(80);
  expect(vaoAbaixoDoTexto, "o mapa encostou no texto").toBeGreaterThanOrEqual(16);
});

test("a atribuição da Google não é cortada pela moldura", async ({ page }) => {
  // The one thing here that would move a theoretical risk into a written violation.
  //
  // The frame is `overflow-hidden`, for its rounded corners, so whatever the iframe
  // exceeds is cut off. What sits along the bottom of a Google embed is "Dados do mapa
  // ©2026 Google" and the link to their terms, and their policies say in so many words
  // not to remove, obscure or hide it.
  //
  // The band's own tests measure `[data-mapa]`, which cannot tell a whole map from a
  // clipped one: both boxes are the right size. This measures the relationship —
  // nothing of the iframe may fall outside the frame that hides overflow.
  //
  // What it catches, measured under mutation (Rule 18 gate, 2026-11-09): a frame
  // SHORTER than the map. `h-40` on `[data-mapa]`, with the ratio left on the iframe,
  // fails here by 96px on the phone and 139px on the desktop, and the message names
  // the foot of the map. layout.spec.ts stays green through that one.
  //
  // What it does NOT catch — and this comment claimed otherwise until the gate proved
  // it wrong: moving the `aspect-*` UP to the frame. The iframe then has no height of
  // its own, falls back to the 150px default and sits INSIDE a taller frame. Nothing
  // is clipped, the attribution survives, and this test passes. That arrangement is
  // caught by layout.spec.ts's "no empty tail", which measures the other direction and
  // says so in its own words.
  //
  // So the pair is the guard, not this test alone: one forbids the frame from being
  // shorter than the map, the other from being taller. Asked for by the security
  // review of 2026-11-08.
  const { sobraAbaixo, sobraLateral } = await page
    .locator("section#onde [data-mapa]")
    .evaluate((frame) => {
      const f = frame.getBoundingClientRect();
      const i = frame.querySelector("iframe")!.getBoundingClientRect();
      return {
        sobraAbaixo: Math.round(i.bottom - f.bottom),
        sobraLateral: Math.round(Math.max(i.right - f.right, f.left - i.left)),
      };
    });
  expect(sobraAbaixo, "a moldura está cortando o pé do mapa, onde fica a atribuição").toBeLessThanOrEqual(
    0,
  );
  expect(sobraLateral, "a moldura está cortando a lateral do mapa").toBeLessThanOrEqual(0);
});

test("o mapa é escurecido antes de entrar na página", async ({ page }) => {
  // Named for what it measures, which is that a filter is applied — not that the
  // result matches the house's palette. It does not: inverted, the map's land is a
  // warm near-neutral and sits about 1,05:1 from the musgo behind it, so the frame's
  // border is what gives it an edge. The point of the filter is that the map stops
  // being the brightest object on the landing, and that is as far as this goes.
  //
  // Asserted on the computed filter rather than on pixels: the tiles do not paint on
  // every network, and a pixel test would be measuring the weather.
  const filtro = await page
    .locator("section#onde [data-mapa] iframe")
    .evaluate((el) => getComputedStyle(el).filter);
  expect(filtro, "o mapa está sem tratamento de brilho").not.toBe("none");
  expect(filtro).toMatch(/invert/);
});
