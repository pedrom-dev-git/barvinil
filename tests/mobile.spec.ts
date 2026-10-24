import { test, expect, type Page } from "@playwright/test";

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
  });

  test("um toque de passagem não mata o rodízio", async ({ page }) => {
    // A phone fires a synthetic mouseenter and never a mouseleave, and a tap on a
    // focusable rail focuses it with no blur to follow. Pausing on either one means
    // the feature the owner asked for dies under the first finger that grazes it.
    await expect.poll(() => aceso(page), { timeout: 12_000 }).toBe("1");

    await page.locator("[data-passa-fotos]").tap();
    await expect.poll(() => aceso(page), { timeout: 12_000 }).toBe("2");
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
    await page
      .locator("[data-passa-fotos]")
      .evaluate((el, i) => el.scrollTo({ left: el.clientWidth * i, behavior: "instant" }), n - 1);
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

  const enviar = s.getByRole("button", { name: /enviar/i });
  const caixa = (await enviar.boundingBox())!;
  expect(caixa.y + caixa.height, "fundo do botão vs. fold").toBeLessThanOrEqual(664);
});
