import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { site, preenchido } from "../content/site";
import { linkReserva, mensagemReserva } from "../lib/whatsapp";

/**
 * The "Reservar mesa" button opens a small form — date, party size, name — and
 * sending it opens WhatsApp with the booking already written. Same pattern as the
 * R. Amaral landing. Still step 1 of the ladder: nothing is stored, the house
 * confirms by hand. UC02 (the real booking system) replaces the target later.
 */

const CTAS = [
  { secao: "hero", onde: "section#hero" },
  { secao: "reservar", onde: "section#reservar" },
] as const;

/** Local YYYY-MM-DD, `dias` from today — what an <input type="date"> takes. */
function isoLocal(dias = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Records window.open instead of leaving for wa.me — no network, no new tab. */
async function gravarAberturas(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { __abertos: string[] }).__abertos = [];
    window.open = ((url?: string | URL) => {
      (window as unknown as { __abertos: string[] }).__abertos.push(String(url));
      return null;
    }) as typeof window.open;
  });
}

const abertos = (page: Page) =>
  page.evaluate(() => (window as unknown as { __abertos: string[] }).__abertos);

test.describe("message", () => {
  test("writes date as DD/MM/AAAA, party size and the name", () => {
    expect(mensagemReserva({ data: "2026-10-09", pessoas: 4, nome: "Pedro" })).toBe(
      "Oi! Gostaria de reservar uma mesa no Vinil para 4 pessoas no dia 09/10/2026, em nome de Pedro.",
    );
  });

  test("says 1 pessoa, not 1 pessoas", () => {
    expect(mensagemReserva({ data: "2026-10-09", pessoas: 1, nome: "Ana" })).toContain(
      "para 1 pessoa no dia",
    );
  });

  test("trims the name", () => {
    expect(mensagemReserva({ data: "2026-10-09", pessoas: 2, nome: "  Ana  " })).toContain(
      "em nome de Ana.",
    );
  });

  test("the link is wa.me with the message encoded", () => {
    const pedido = { data: "2026-10-09", pessoas: 2, nome: "Ana" };
    expect(linkReserva("+55 (51) 99442-4243", pedido)).toBe(
      `https://wa.me/5551994424243?text=${encodeURIComponent(mensagemReserva(pedido))}`,
    );
  });
});

for (const { secao, onde } of CTAS) {
  test.describe(`booking form in #${secao}`, () => {
    test.skip(!preenchido(site.whatsapp), "no phone number in content/site.ts");

    test.beforeEach(async ({ page }) => {
      await gravarAberturas(page);
      await page.goto("/");
    });

    test("stays closed until the button is pressed", async ({ page }) => {
      const botao = page.locator(onde).getByRole("button", { name: /reservar mesa/i });
      await expect(botao).toHaveAttribute("aria-expanded", "false");
      await expect(page.locator(onde).getByLabel(/nome/i)).toBeHidden();

      await botao.click();
      await expect(botao).toHaveAttribute("aria-expanded", "true");
      await expect(page.locator(onde).getByLabel(/data/i)).toBeVisible();
      await expect(page.locator(onde).getByLabel(/pessoas/i)).toBeVisible();
      await expect(page.locator(onde).getByLabel(/nome/i)).toBeVisible();
    });

    test("sends the filled booking to WhatsApp", async ({ page }) => {
      if (!preenchido(site.whatsapp)) return;
      const s = page.locator(onde);
      await s.getByRole("button", { name: /reservar mesa/i }).click();

      const data = isoLocal(3);
      await s.getByLabel(/data/i).fill(data);
      await s.getByLabel(/pessoas/i).fill("4");
      await s.getByLabel(/nome/i).fill("Pedro");
      await s.getByRole("button", { name: /enviar/i }).click();

      expect(await abertos(page)).toEqual([
        linkReserva(site.whatsapp.valor.e164, { data, pessoas: 4, nome: "Pedro" }),
      ]);
    });

    test("does not send an incomplete booking", async ({ page }) => {
      const s = page.locator(onde);
      await s.getByRole("button", { name: /reservar mesa/i }).click();
      await s.getByLabel(/pessoas/i).fill("2");
      await s.getByRole("button", { name: /enviar/i }).click();

      expect(await abertos(page)).toEqual([]);
    });

    test("does not offer a date in the past", async ({ page }) => {
      const s = page.locator(onde);
      await s.getByRole("button", { name: /reservar mesa/i }).click();
      await expect(s.getByLabel(/data/i)).toHaveAttribute("min", isoLocal(0));
      await expect(s.getByLabel(/pessoas/i)).toHaveAttribute("min", "1");
    });
  });
}

test("the open form has no WCAG A/AA violations", async ({ page }) => {
  test.skip(!preenchido(site.whatsapp), "no phone number in content/site.ts");
  await page.goto("/");
  await page.locator("section#hero").getByRole("button", { name: /reservar mesa/i }).click();

  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(
    violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(" | ")}`),
  ).toEqual([]);
});
