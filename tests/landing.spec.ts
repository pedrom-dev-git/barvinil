import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { site, preenchido } from "../content/site";

/** The five sections plano-pmv.md §1 fixed, in order. The scope does not grow. */
const SECOES = ["hero", "casa", "fotos", "onde", "reservar"] as const;

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("renders the five sections, in the order the plan fixed", async ({ page }) => {
  for (const id of SECOES) {
    await expect(page.locator(`section#${id}`)).toBeVisible();
  }

  const ordemNaPagina = await page
    .locator("section[id]")
    .evaluateAll((nodes) => nodes.map((n) => n.id));
  expect(ordemNaPagina).toEqual([...SECOES]);
});

test("leads with the wordmark and the tagline, above the fold", async ({ page }) => {
  const tagline = preenchido(site.tagline) ? site.tagline.valor : "";

  // The h1 carries the wordmark. It renders as the logo image when public/ has the
  // file and as type when it does not — the logo is the bar's trademark and is not
  // committed, so asserting on the <img> would fail on a clean clone by design.
  // What must hold either way is the accessible name.
  const h1 = page.getByRole("heading", { level: 1 });
  await expect(h1).toBeVisible();
  await expect(h1).toHaveAccessibleName(/vinil/i);

  const logo = h1.locator("img");
  if ((await logo.count()) > 0) await expect(logo).toBeVisible();

  await expect(page.locator("section#hero")).toContainText(tagline);
});

test("address, phone, menu and Instagram match content/site.ts", async ({ page }) => {
  const onde = page.locator("section#onde");

  if (preenchido(site.endereco)) {
    const e = site.endereco.valor;
    await expect(onde).toContainText(e.logradouro);
    await expect(onde).toContainText(e.bairro);
    await expect(onde.getByRole("link", { name: /como chegar|mapa/i })).toHaveAttribute(
      "href",
      e.mapsUrl,
    );
  }
  if (preenchido(site.whatsapp)) {
    await expect(onde).toContainText(site.whatsapp.valor.exibicao);
  }
  if (preenchido(site.cardapio)) {
    await expect(onde.getByRole("link", { name: /cardápio/i })).toHaveAttribute(
      "href",
      site.cardapio.valor,
    );
  }
  if (preenchido(site.instagram)) {
    await expect(onde.getByRole("link", { name: /instagram|@barvinil/i })).toHaveAttribute(
      "href",
      site.instagram.valor.url,
    );
  }
});

test("the delivery channel the house already sells on is one tap away", async ({
  page,
}) => {
  // Every channel this section offers ends in the room: the WhatsApp asks for a
  // table, the menu is a PDF of what the kitchen plates, the map is directions. The
  // house also sells its smoked boards for delivery, and the page could not say so
  // at all — so a guest who arrived from Instagram deciding where to eat tonight,
  // and who was not going out, had no answer here.
  //
  // The href is matched by shape, not by its full string: the store id is the one
  // part of it that is the marketplace's to change.
  const link = page.locator("section#onde").getByRole("link", {
    name: /ifood|delivery/i,
  });

  await expect(link).toHaveAttribute(
    "href",
    /^https:\/\/www\.ifood\.com\.br\/delivery\/canoas-rs\//,
  );
  // Same two rules as every other row in this list: it leaves for a third party in
  // a tab of its own, without handing that party a handle on this page, and it is a
  // thumb-sized target.
  await expect(link).toHaveAttribute("rel", /noopener/);
  expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(48);
});

test("no unfilled placeholder ever reaches the page", async ({ page }) => {
  const texto = (await page.locator("body").innerText()).toLowerCase();
  expect(texto).not.toContain("a preencher");
  expect(texto).not.toContain("⟨");
  expect(texto).not.toContain("undefined");
  expect(texto).not.toContain("null");
});

test("copy the owner has not approved never reaches the page", async ({ page }) => {
  // A `a-preencher` field can still hold draft text — copy the group wrote and the
  // owner has not signed off on. Checking only for ⟨A PREENCHER⟩ misses it entirely:
  // this pins the actual draft strings.
  const rascunhos = Object.values(site)
    .filter((d) => (d as { status: string }).status === "a-preencher")
    .map((d) => (d as { valor: unknown }).valor)
    .filter((v): v is string => typeof v === "string" && v.length > 24);

  expect(rascunhos.length, "no draft copy left to guard — relax this test").toBeGreaterThan(0);

  const texto = await page.locator("body").innerText();
  for (const rascunho of rascunhos) {
    expect(texto, `draft copy leaked: "${rascunho.slice(0, 40)}…"`).not.toContain(
      rascunho.slice(0, 40),
    );
  }
});

test("the phone viewport never scrolls sideways", async ({ page }) => {
  const estouro = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(estouro).toBeLessThanOrEqual(0);
});

test("every tap target on the phone is at least 44px tall", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "tap targets are a touch concern");

  const alvos = page.locator("section a, section button");
  const total = await alvos.count();
  expect(total).toBeGreaterThan(0);

  for (let i = 0; i < total; i++) {
    const alvo = alvos.nth(i);
    if (!(await alvo.isVisible())) continue;
    const caixa = await alvo.boundingBox();
    expect(caixa, `alvo ${i} sem caixa`).not.toBeNull();
    expect.soft(caixa!.height, `alvo ${i}: "${await alvo.innerText()}"`).toBeGreaterThanOrEqual(44);
  }
});

test("the page says it is a class prototype, not the house's official site", async ({ page }) => {
  // The site is published, and content/site.ts is still largely `fonte-publica`:
  // facts about the bar taken from its public profiles, which the owner has not
  // confirmed. Whoever opens the link has to be told that, on the page — robots.txt
  // and the README reach nobody who just received the URL.
  const rodape = page.locator("footer");
  await expect(rodape).toBeVisible();

  const aviso = await rodape.innerText();
  expect(aviso).toMatch(/prot[óo]tipo acad[êe]mico/i);
  expect(aviso).toMatch(/n[ãa]o\s+é\s+o\s+site\s+oficial/i);
  expect(aviso).toMatch(/unilasalle/i);

  // It must not read as a sixth section: the scope is five, and the plan says so.
  const ordemNaPagina = await page
    .locator("section[id]")
    .evaluateAll((nodes) => nodes.map((n) => n.id));
  expect(ordemNaPagina).toEqual([...SECOES]);
});

test("wears the official brandbook palette: Areia Rosada on Musgo Urbano", async ({ page }) => {
  // BrandBook_VINIL25 p.23, delivered by the owner on 2026-09-25. It replaces the
  // cream-on-black that had been inferred from the logo PNG alone. The green was
  // then set to #143325 by Pedro on 2026-09-25, over the book's #1A2B2F.
  const body = page.locator("body");
  await expect(body).toHaveCSS("background-color", "rgb(20, 51, 37)");
  await expect(body).toHaveCSS("color", "rgb(255, 237, 210)");
});

test("sets text in Gorga Grotesque and the one call-out in Dancing Script", async ({ page }) => {
  // Brandbook p.24–25: Gorga for running text and contact data, Dancing Script for
  // "calls or words that demand emphasis" — and it warns against excess.
  const familia = (el: Element) => getComputedStyle(el).fontFamily;
  expect(await page.locator("body").evaluate(familia)).toMatch(/gorga/i);

  const destaques = await page
    .locator("body *")
    .evaluateAll((els) =>
      els.filter((el) => /dancing/i.test(getComputedStyle(el).fontFamily) && el.children.length === 0),
    );
  expect(destaques.length).toBeGreaterThan(0);
  expect(destaques.length, "the brandbook warns against excess").toBeLessThanOrEqual(2);
});

test("uses the official artwork for the wordmark and the V icon as favicon", async ({ page }) => {
  // Both files are the bar's trademark and stay out of git, so on a clean clone
  // there is nothing to assert — same rule as the logo in the hero test.
  const temIcone = existsSync(join(process.cwd(), "public", "icon.png"));
  const temLogo = existsSync(join(process.cwd(), "public", "logo-vinil.png"));
  test.skip(!temIcone && !temLogo, "brand files not installed in public/");

  if (temIcone) {
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute("href", /\/icon\.png/);
  }
  if (temLogo) {
    // The official lockup carries "(hi-fi bar)" under the name: ~2.2:1, where the
    // old bare wordmark was ~2.8:1.
    const logo = page.getByRole("heading", { level: 1 }).locator("img");
    const proporcao = await logo.evaluate(
      (img: HTMLImageElement) => img.naturalWidth / img.naturalHeight,
    );
    expect(proporcao).toBeGreaterThan(2.1);
    expect(proporcao).toBeLessThan(2.3);
  }
});

test("the gallery leads with the photos it has, and never shows a broken one", async ({ page }) => {
  // A slot can name a file this checkout does not have: the house delivers them one
  // at a time, and the brief is written before the photograph exists. Such a slot
  // must render as an empty frame, not as a broken image.
  const disponiveis = (site.fotos.valor ?? []).filter(
    (f) => f.arquivo !== null && existsSync(join(process.cwd(), "public", "fotos", f.arquivo)),
  );
  const n = disponiveis.length;

  const quadros = page.locator("section#fotos li");
  // Only photos ride the rail; the groove frames are for having none at all.
  await expect(quadros).toHaveCount(n || 3);
  await expect(page.locator("section#fotos li img")).toHaveCount(n);

  for (let i = 0; i < n; i++) {
    await expect(quadros.nth(i).locator("img")).toHaveAttribute("alt", disponiveis[i].alt);
  }
});

test("the house section speaks with the owner's own words", async ({ page }) => {
  // The lead line and the paragraphs under it are all his, so this reads them off
  // content/site.ts instead of pinning the copy here: when he changes a word, the
  // page is what has to follow, not the test. What is asserted is that none of
  // them is sitting in the file unrendered — a draft nobody approved never shows,
  // and words he did approve must not stay hidden either.
  expect(
    preenchido(site.descricao) && preenchido(site.historia),
    "a casa fala com as palavras do dono: descrição e história têm de renderizar",
  ).toBe(true);

  const casa = page.locator("section#casa");
  await expect(casa.getByText(site.descricao.valor ?? "", { exact: true })).toBeVisible();

  // One paragraph per break he wrote. Run together into a single block the manifesto
  // is ~90 words with no landing anywhere, and on a 390px phone that is sixteen lines
  // of unbroken type — the shape of text people scroll past rather than read.
  const paragrafos = site.historia.valor ?? [];
  expect(paragrafos.length, "a história do dono vem em parágrafos").toBeGreaterThan(1);
  for (const p of paragrafos) {
    await expect(casa.getByText(p, { exact: true })).toBeVisible();
  }
});

test("no paragraph on the page is a wall of text", async ({ page }) => {
  // A limit on the page, not on one section: the next long thing the house sends is
  // pasted in the same way the manifesto was, and this is what catches it.
  const paragrafos = await page.locator("main p").allInnerTexts();
  expect(paragrafos.length, "a página não tem parágrafo nenhum").toBeGreaterThan(0);

  for (const texto of paragrafos) {
    const palavras = texto.trim().split(/\s+/).length;
    expect.soft(palavras, `parágrafo de ${palavras} palavras: "${texto.slice(0, 48)}…"`)
      .toBeLessThanOrEqual(55);
  }
});

test("the link carries a preview card into the chat it is pasted into", async ({ page }) => {
  // RNF01 fixes the arrival: the guest comes from Instagram, on a phone. That means
  // the link is pasted into a chat far more often than it is typed — and a page with
  // no og:image pastes as a grey rectangle with a URL under it, which in a WhatsApp
  // thread reads as a link somebody broke.
  const og = (p: string) => page.locator(`meta[property="og:${p}"]`);
  await expect(og("title")).toHaveCount(1);

  const url = await og("image").getAttribute("content");
  expect(url, "sem og:image o link cola como um retângulo cinza").toBeTruthy();
  // Absolute by definition: whatever fetches the card has no page of ours open to
  // resolve a relative path against.
  expect(url, "og:image relativo não resolve fora do site").toMatch(/^https:\/\//);

  const arquivo = join(process.cwd(), "public", new URL(url!).pathname.split("/").pop()!);
  expect(existsSync(arquivo), `${url} não existe em public/`).toBe(true);

  // Declared, so the chat lays out the wide card instead of a thumbnail beside text.
  await expect(og("image:width")).toHaveAttribute("content", "1200");
  await expect(og("image:height")).toHaveAttribute("content", "630");

  // The same statement the footer makes, on the one surface where this page is seen
  // without its footer. A card forwarded on from there must not read as the house's
  // official site — it comes out with the footer, when the owner approves the copy.
  const descricao = await og("description").getAttribute("content");
  expect(descricao, "o card tem de dizer o que a página é").toMatch(/prot[óo]tipo/i);
});

/** Which reel is published is a decision that changes, so the hero has to stand up
 *  with no file at all — the same way it stands up without the logo. */
const temVideoHero =
  preenchido(site.videoHero) &&
  existsSync(join(process.cwd(), "public", "video", site.videoHero.valor));

test("the hero plays the house's reel behind the name, never over it", async ({ page }) => {
  const video = page.locator("section#hero video");

  if (!temVideoHero) {
    await expect(video).toHaveCount(0);
    return;
  }

  await expect(video).toHaveCount(1);
  // Decoration, not content: it says nothing the page does not already say in type,
  // so it stays out of the accessibility tree and out of the tab order.
  await expect(video).toHaveAttribute("aria-hidden", "true");
  await expect(video).toHaveJSProperty("muted", true);
  await expect(video).toHaveJSProperty("loop", true);

  // This number used to stand in for legibility: nothing measured what the type was
  // actually read against, so the reel was held faint and that was the whole defence.
  // contraste.spec.ts now reads the composited pixels and asks each piece of type for
  // its WCAG floor, which is the real guarantee — so what is left here is the weaker
  // statement the number was always making: the reel is a background. It is never
  // played at full strength behind type, and the scrim is always over it.
  //
  // No slack on purpose. Raising it is a decision that has to be measured again.
  const opacidade = await video.evaluate((el) => parseFloat(getComputedStyle(el).opacity));
  expect(opacidade).toBeLessThanOrEqual(0.6);
  await expect(page.locator("section#hero [data-cortina]")).toHaveCount(1);

  // The name, the tagline and the booking form are the hero; the reel is behind them.
  const atras = await page.evaluate(() => {
    const v = document.querySelector("section#hero video");
    const h1 = document.querySelector("section#hero h1");
    if (!v || !h1) return null;
    const z = (el: Element) => Number(getComputedStyle(el.parentElement ?? el).zIndex) || 0;
    return z(h1) > z(v);
  });
  expect(atras, "o conteúdo do topo tem de ficar sobre o vídeo").toBe(true);
});

test("the hero's reel does not play for anyone who asked for less motion", async ({ page }) => {
  // Same stance as .gira and as the gallery: movement is opt-in. There is no reel
  // paused in the background either — there is no reel.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const pediuMenosMovimento = await page.evaluate(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  expect(pediuMenosMovimento, "emulation did not reach the page").toBe(true);

  await expect(page.locator("section#hero video")).toHaveCount(0);
});
