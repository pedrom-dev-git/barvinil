import { test, expect, type Page } from "@playwright/test";
import { site, preenchido } from "../content/site";
import { linkReserva } from "../lib/whatsapp";

/**
 * What a finger does, which the rest of the suite never does.
 *
 * Every other spec drives the booking form with `fill()`, and `fill()` neither
 * fires `click` nor checks that the element receives pointer events — so a field
 * no thumb can reach still tests green. The guest arrives from Instagram, on a
 * phone (RNF01), so these run on the `mobile` project only.
 */

test.beforeEach(async ({}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "estas são questões de toque");
});

/** iOS, reproduced: showPicker() exists and does nothing at all, silently. */
const COMO_IOS = `HTMLInputElement.prototype.showPicker = function () {};`;
/** The older case: the method is not there to call. */
const SEM_SHOWPICKER = `delete HTMLInputElement.prototype.showPicker;`;

async function abrirReserva(page: Page) {
  const s = page.locator("section#reservar");
  await s.scrollIntoViewIfNeeded();
  await s.getByRole("button", { name: /reservar mesa/i }).click();
  await expect(s.getByLabel(/data/i)).toBeVisible();
  return s;
}

test.describe("o campo Data, com o dedo", () => {
  // On iOS, showPicker() for type=date is not implemented and does NOT throw
  // (WebKit 268114 / 261703, both open). Anything that leans on it is dead on an
  // iPhone, and every browser on an iPhone is WebKit.
  for (const [nome, roteiro] of [
    ["o picker não faz nada (iPhone)", COMO_IOS],
    ["o picker não existe", SEM_SHOWPICKER],
  ] as const) {
    test(`um toque abre a data quando ${nome}`, async ({ page }) => {
      await page.addInitScript(roteiro);
      await page.goto("/");
      const s = await abrirReserva(page);

      const campo = s.getByLabel(/data/i);
      await campo.tap();

      // The thing the finger landed on has to be a real date control: the browser
      // opens its own picker for one, with no API in the way.
      await expect(campo).toHaveAttribute("type", "date");
      await expect(campo).not.toHaveAttribute("aria-hidden", "true");

      const caixa = (await campo.boundingBox())!;
      expect(caixa.height, "alvo de toque").toBeGreaterThanOrEqual(44);
      expect(caixa.width).toBeGreaterThan(200);
      expect(await campo.evaluate((el) => getComputedStyle(el).pointerEvents)).not.toBe("none");

      // And it is the control the form submits, reachable by keyboard too.
      await expect(campo).toHaveAttribute("name", "data");
      expect(await campo.evaluate((el) => (el as HTMLInputElement).tabIndex)).toBeGreaterThanOrEqual(
        0,
      );
    });
  }

  test("só existe um campo de data, e nenhum fantasma de 1px", async ({ page }) => {
    await page.addInitScript(COMO_IOS);
    await page.goto("/");
    const s = await abrirReserva(page);

    const caixas = await s.locator("input").evaluateAll((es) =>
      es.map((e) => {
        const b = e.getBoundingClientRect();
        return { tipo: (e as HTMLInputElement).type, w: Math.round(b.width), h: Math.round(b.height) };
      }),
    );
    expect(caixas.filter((c) => c.tipo === "date")).toHaveLength(1);
    // A control parked at 1×1 is a control nobody can press.
    expect(caixas.filter((c) => c.w <= 2 || c.h <= 2)).toEqual([]);
  });
});

test.describe("o passa-fotos, com o dedo", () => {
  const PONTO = "section#fotos [data-ponto]";
  const aceso = (page: Page) =>
    page.locator(`${PONTO}[aria-current="true"]`).getAttribute("data-ponto");

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.locator("section#fotos").scrollIntoViewIfNeeded();
    // The dots are measured off the laid-out rail, so they arrive with hydration and
    // not with the HTML. Counting them before that reads zero and tests nothing.
    await expect(page.locator(PONTO).first()).toBeVisible();
  });

  test("um toque de passagem não mata o rodízio", async ({ page }) => {
    // A phone fires a synthetic mouseenter and never a mouseleave, and a tap on a
    // focusable rail focuses it with no blur to follow. Pausing on either one means
    // the feature the owner asked for dies under the first finger that grazes it.
    const n = await page.locator(PONTO).count();
    await expect.poll(() => aceso(page), { timeout: 12_000 }).toBe("1");

    await page.locator("[data-passa-fotos]").tap();
    await expect.poll(() => aceso(page), { timeout: 12_000 }).toBe(String(2 % n));
  });

  test("tocar um ponto fixa a foto escolhida", async ({ page }) => {
    await page.locator('[data-ponto="1"]').tap();
    await expect.poll(() => aceso(page)).toBe("1");

    // Having chosen, the guest is not dragged somewhere else five seconds later.
    await page.waitForTimeout(7000);
    expect(await aceso(page)).toBe("1");
  });

  test("arrastar com a mão também fixa", async ({ page }) => {
    const n = await page.locator(PONTO).count();
    // To the end of the travel, not to clientWidth × i: frames are separated by a
    // gap now, so a multiple of the view is a place the rail does not come to rest,
    // and a rail left between two frames is not a hand that chose one.
    await page
      .locator("[data-passa-fotos]")
      .evaluate((el) => el.scrollTo({ left: el.scrollWidth - el.clientWidth, behavior: "instant" }));
    await expect.poll(() => aceso(page)).toBe(String(n - 1));

    await page.waitForTimeout(7000);
    expect(await aceso(page)).toBe(String(n - 1));
  });
});

test("o botão de enviar cabe na tela do celular de verdade", async ({ page }) => {
  // 390×844 is the iPhone's CSS viewport with no browser chrome. A real phone has
  // an address bar: Chrome Android leaves about 664px. The suite's default hides
  // 122px of the open panel below the fold, submit button included.
  await page.setViewportSize({ width: 390, height: 664 });
  await page.goto("/");

  // From the top of the page, untouched — the hero's button is the first one the
  // guest meets, and the panel it opens grows downwards from there.
  const s = page.locator("section#hero");
  await s.getByRole("button", { name: /reservar mesa/i }).click();
  await expect(s.getByLabel(/data/i)).toBeVisible();

  // The panel eases open over half a second, so this is where it comes to rest.
  const enviar = s.getByRole("button", { name: /enviar/i });
  await expect
    .poll(async () => {
      const c = (await enviar.boundingBox())!;
      return c.y + c.height;
    }, { message: "fundo do botão vs. fold" })
    .toBeLessThanOrEqual(664);
});

test.describe("o envio, quando o browser recusa a aba", () => {
  test.skip(!preenchido(site.whatsapp), "no phone number in content/site.ts");

  /** Local YYYY-MM-DD, three days out — what an <input type="date"> takes. */
  function daquiA(dias: number): string {
    const d = new Date();
    d.setDate(d.getDate() + dias);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }

  const PEDIDO = { hora: "20:30", pessoas: 4, nome: "Pedro" };

  async function preencher(page: Page, data: string) {
    const s = await abrirReserva(page);
    await s.getByLabel(/data/i).fill(data);
    await s.getByLabel(/hora/i).selectOption(PEDIDO.hora);
    await s.getByLabel(/pessoas/i).fill(String(PEDIDO.pessoas));
    await s.getByLabel(/nome/i).fill(PEDIDO.nome);
    return s;
  }

  test("o pedido sai na mesma aba", async ({ page }) => {
    if (!preenchido(site.whatsapp)) return;
    // WebKit only opens a window it can tie to a user gesture, and iOS drops that
    // token easily — the engine then answers window.open with null. The booking
    // used to die right there: no tab, no error, no WhatsApp, nothing said.
    await page.addInitScript(`window.open = () => null;`);
    await page.route("https://wa.me/**", (rota) =>
      rota.fulfill({ status: 200, contentType: "text/html", body: "<title>wa</title>" }),
    );
    await page.goto("/");

    const data = daquiA(3);
    const s = await preencher(page, data);
    await s.getByRole("button", { name: /enviar/i }).tap();

    await page.waitForURL(/wa\.me/);
    expect(page.url()).toBe(linkReserva(site.whatsapp.valor.e164, { data, ...PEDIDO }));
  });

  test("com a aba liberada, a página fica onde está", async ({ page }) => {
    if (!preenchido(site.whatsapp)) return;
    await page.addInitScript(`window.open = () => ({});`);
    await page.goto("/");
    const inicio = page.url();

    const s = await preencher(page, daquiA(3));
    await s.getByRole("button", { name: /enviar/i }).tap();

    // The happy path still opens a tab, and the page the guest came from stays put.
    await page.waitForTimeout(500);
    expect(page.url()).toBe(inicio);
  });
});
