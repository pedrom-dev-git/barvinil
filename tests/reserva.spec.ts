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
  test("writes date as DD/MM/AAAA, the time, party size and the name", () => {
    expect(
      mensagemReserva({ data: "2026-10-09", hora: "20:30", pessoas: 4, nome: "Pedro" }),
    ).toBe(
      "Oi! Gostaria de reservar uma mesa no Vinil para 4 pessoas no dia 09/10/2026 às 20:30, em nome de Pedro.",
    );
  });

  test("says 1 pessoa, not 1 pessoas", () => {
    expect(mensagemReserva({ data: "2026-10-09", hora: "19:00", pessoas: 1, nome: "Ana" })).toContain(
      "para 1 pessoa no dia",
    );
  });

  test("trims the name", () => {
    expect(mensagemReserva({ data: "2026-10-09", hora: "19:00", pessoas: 2, nome: "  Ana  " })).toContain(
      "em nome de Ana.",
    );
  });

  test("the link is wa.me with the message encoded", () => {
    const pedido = { data: "2026-10-09", hora: "19:00", pessoas: 2, nome: "Ana" };
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
      await expect(page.locator(onde).getByLabel(/hora/i)).toBeVisible();
      await expect(page.locator(onde).getByLabel(/pessoas/i)).toBeVisible();
      await expect(page.locator(onde).getByLabel(/nome/i)).toBeVisible();
    });

    test("sends the filled booking to WhatsApp", async ({ page }) => {
      if (!preenchido(site.whatsapp)) return;
      const s = page.locator(onde);
      await s.getByRole("button", { name: /reservar mesa/i }).click();

      // The calendar is the browser's own, and so is the field: what the guest
      // reads over it is ours, in pt-BR, whatever locale the phone is set to.
      const data = isoLocal(3);
      await s.getByLabel(/data/i).fill(data);
      const [ano, mes, dia] = data.split("-");
      await expect(s.locator("[data-data-extenso]")).toHaveText(
        new RegExp(`^${dia}/${mes}/${ano}`),
      );

      await s.getByLabel(/hora/i).selectOption("20:30");
      await s.getByLabel(/pessoas/i).fill("4");
      await s.getByLabel(/nome/i).fill("Pedro");
      await s.getByRole("button", { name: /enviar/i }).click();

      expect(await abertos(page)).toEqual([
        linkReserva(site.whatsapp.valor.e164, { data, hora: "20:30", pessoas: 4, nome: "Pedro" }),
      ]);
    });

    test("does not send an incomplete booking", async ({ page }) => {
      const s = page.locator(onde);
      await s.getByRole("button", { name: /reservar mesa/i }).click();
      await s.getByLabel(/pessoas/i).fill("2");
      await s.getByRole("button", { name: /enviar/i }).click();

      expect(await abertos(page)).toEqual([]);
    });

    test("an empty field never looks filled in", async ({ page }) => {
      // A sample value ("2", "Seu nome") in the placeholder read as an answer
      // already given. Only format hints stay, and they are faded.
      const s = page.locator(onde);
      await s.getByRole("button", { name: /reservar mesa/i }).click();
      await expect(s.getByLabel(/pessoas/i)).not.toHaveAttribute("placeholder", /.+/);
      await expect(s.getByLabel(/nome/i)).not.toHaveAttribute("placeholder", /.+/);

      // The date hint is drawn text, not a ::placeholder — the field underneath is
      // the browser's own date input, worn transparent. It still has to read as a
      // hint: fainter than the date it will be replaced by.
      const cor = (el: Element) => getComputedStyle(el).color;
      const dica = s.locator("[data-data-extenso]");
      const apagada = await dica.evaluate(cor);
      await s.getByLabel(/data/i).fill(isoLocal(1));
      expect(await dica.evaluate(cor)).not.toBe(apagada);

      const hora = s.getByLabel(/hora/i);
      const corVazia = await hora.evaluate((el) => getComputedStyle(el).color);
      await hora.selectOption("20:30");
      expect(await hora.evaluate((el) => getComputedStyle(el).color)).not.toBe(corVazia);
    });

    test("times are 24h, pt-BR style, never AM/PM", async ({ page }) => {
      const s = page.locator(onde);
      await s.getByRole("button", { name: /reservar mesa/i }).click();
      const horas = await s
        .getByLabel(/hora/i)
        .locator("option:not([value=''])")
        .evaluateAll((os) => os.map((o) => o.textContent ?? ""));
      expect(horas.length).toBeGreaterThan(0);
      for (const h of horas) expect(h).toMatch(/^([01]\d|2[0-3]):[0-5]\d$/);
    });

    // The window the owner settled on 2026-10-25. It says when the house takes a
    // table, not when it opens: site.horarioDetalhado is still a-preencher, and
    // nothing on this page claims otherwise.
    test("only offers the booking window, 19:30 to 22:30", async ({ page }) => {
      const s = page.locator(onde);
      await s.getByRole("button", { name: /reservar mesa/i }).click();
      const horas = await s
        .getByLabel(/hora/i)
        .locator("option:not([value=''])")
        .evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value));

      expect(horas).toEqual([
        "19:30",
        "20:00",
        "20:30",
        "21:00",
        "21:30",
        "22:00",
        "22:30",
      ]);
    });

    test("says the window out loud, next to the field", async ({ page }) => {
      // A list that just stops at 22:30 leaves the guest guessing why. The hint is
      // tied to the select, so it is read with the field and not only seen near it.
      const s = page.locator(onde);
      await s.getByRole("button", { name: /reservar mesa/i }).click();

      const dica = s.locator("[data-dica-hora]");
      await expect(dica).toHaveText(/19:30.*22:30/);
      expect(await s.getByLabel(/hora/i).getAttribute("aria-describedby")).toBe(
        await dica.getAttribute("id"),
      );
    });

    test("does not offer a date in the past", async ({ page }) => {
      const s = page.locator(onde);
      await s.getByRole("button", { name: /reservar mesa/i }).click();
      await expect(s.locator('input[type="date"]')).toHaveAttribute("min", isoLocal(0));
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

test.describe("opening motion", () => {
  test.skip(!preenchido(site.whatsapp), "no phone number in content/site.ts");

  /** Seconds of the longest transition on the panel. */
  const duracao = (page: Page) =>
    page
      .locator("section#hero [data-painel-reserva]")
      .evaluate((el) =>
        Math.max(...getComputedStyle(el).transitionDuration.split(",").map((s) => parseFloat(s))),
      );

  test("the panel eases open instead of popping in", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: null });
    await page.goto("/");
    expect(await duracao(page)).toBeGreaterThanOrEqual(0.3);

    // Still hidden from everyone while closed — sight, keyboard and screen readers.
    const painel = page.locator("section#hero [data-painel-reserva]");
    await expect(painel).toHaveAttribute("inert", "");
    await expect(page.locator("section#hero").getByLabel(/nome/i)).toBeHidden();

    await page.locator("section#hero").getByRole("button", { name: /reservar mesa/i }).click();
    await expect(painel).not.toHaveAttribute("inert");
    await expect(page.locator("section#hero").getByLabel(/nome/i)).toBeVisible();
  });

  test("and simply appears for anyone who asked for less motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    expect(await duracao(page)).toBeLessThan(0.05);
  });
});
