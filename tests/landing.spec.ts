import { test, expect } from "@playwright/test";
import { site, preenchido } from "../content/site";
import { linkWhatsApp, MENSAGENS } from "../lib/whatsapp";

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

test("the booking CTA opens WhatsApp with the message already written", async ({ page }) => {
  const whats = site.whatsapp;
  test.skip(!preenchido(whats), "no phone number in content/site.ts");
  if (!preenchido(whats)) return;

  const esperado = linkWhatsApp(whats.valor.e164, "reserva");
  const cta = page.getByRole("link", { name: /reservar mesa/i }).first();

  await expect(cta).toBeVisible();
  await expect(cta).toHaveAttribute("href", esperado);
  expect(decodeURIComponent(esperado)).toContain(MENSAGENS.reserva);
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
