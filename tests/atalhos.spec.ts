import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";
import { site, preenchido } from "../content/site";

/**
 * The dock: the two doors that leave the page, within reach of a thumb.
 *
 * Everything else on this landing is read top to bottom. These two are errands —
 * order food, get here — and a guest who has decided either one should not have to
 * find the fourth section to act on it. So they float, on the phone only: on a
 * desktop a pill in the corner is where chat widgets live, and it reads as an ad.
 *
 * What most of this file guards is not that the dock appears. It is that it KNOWS
 * HOW TO LEAVE. A bar fixed over the bottom of a phone sits exactly where this page
 * puts its submit buttons, and a button under an overlay is a button nobody can
 * press — while every existing test of those buttons measures geometry, and
 * geometry cannot see an overlay. That is the hole these tests close.
 */

const DOCK = "[data-atalhos]";

/** Only the phone has a dock, so the desktop project asserts its absence instead. */
const noCelular = (page: Page) => page.viewportSize()!.width < 640;

const visibilidade = (page: Page) =>
  page.locator(DOCK).evaluate((el) => getComputedStyle(el).visibility);

/** Scrolls a section into view and lets the dock's observer settle on it. */
async function irPara(page: Page, id: string) {
  await page.locator(`section#${id}`).scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
}

/**
 * Asserted at the top of every test that measures the dock's behaviour.
 *
 * Without it half this file passes on a page that has no dock at all: a loop over
 * zero pills checks nothing, `toBeHidden` is true of an element that does not
 * exist, and a submit button is unobstructed when there is nothing to obstruct it.
 * Those are green tests measuring an absence, which is worse than no test.
 */
async function existe(page: Page) {
  await expect(page.locator(DOCK), "não há dock nenhum na página").toHaveCount(1);
  await expect(page.locator(DOCK).getByRole("link")).toHaveCount(2);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("leva as duas portas que saem da página, e só elas", async ({ page }) => {
  const dock = page.locator(DOCK);
  await expect(dock).toHaveCount(1);

  const links = dock.getByRole("link");
  await expect(links).toHaveCount(2);

  const ifood = dock.getByRole("link", { name: /ifood/i });
  await expect(ifood).toHaveAttribute(
    "href",
    /^https:\/\/www\.ifood\.com\.br\/delivery\/canoas-rs\//,
  );

  // The route, not the place card. The link in #onde points at the pin; this one
  // asks the guest's own maps app for turn-by-turn, which is the errand.
  const rota = dock.getByRole("link", { name: /como chegar/i });
  await expect(rota).toHaveAttribute(
    "href",
    /^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=/,
  );

  for (const l of [ifood, rota]) {
    await expect(l).toHaveAttribute("target", "_blank");
    await expect(l).toHaveAttribute("rel", /noopener/);
  }
});

test("no desktop o dock existe no DOM e não é exibido", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "é uma questão de largura");
  // Asserted as "in the markup and not displayed", not as "absent": a page with no
  // dock at all satisfies `toBeHidden` too, and this test would then pass for the
  // rest of its life without ever measuring the `sm:` breakpoint it exists for.
  await irPara(page, "fotos");
  await expect(page.locator(DOCK)).toHaveCount(1);
  await expect(page.locator(DOCK)).toBeHidden();
});

test.describe("no celular", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!noCelular(page), "o dock é do telefone");
  });

  test("é fixo de verdade, e não só declarado fixo", async ({ page }) => {
    // `position: fixed` inside an ancestor with a `transform` silently stops being
    // fixed — and app/globals.css puts a transform on every `main section` through
    // the .revelar class. Asserting on getComputedStyle().position would pass while
    // the dock scrolled away with the page, so this measures the only thing that
    // settles it: does it stay put.
    await irPara(page, "fotos");
    const antes = (await page.locator(DOCK).boundingBox())!.y;
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(300);
    const depois = (await page.locator(DOCK).boundingBox())!.y;
    expect(depois, "o dock rolou com a página").toBeCloseTo(antes, 0);
  });

  test("cada pill é um alvo de polegar", async ({ page }) => {
    // landing.spec.ts measures `section a, section button`, and the dock lives
    // outside every <section> on purpose — so it is invisible to that budget and
    // has to carry its own.
    await existe(page);
    await irPara(page, "fotos");
    const links = page.locator(DOCK).getByRole("link");
    for (let i = 0; i < (await links.count()); i++) {
      const caixa = (await links.nth(i).boundingBox())!;
      expect(caixa.height, `pill ${i}`).toBeGreaterThanOrEqual(44);
    }
  });

  test("não aparece na primeira tela, entra depois do hero e sai antes da reserva", async ({
    page,
  }) => {
    // The first screen belongs to "Reservar mesa", which is the action this project
    // is marked on, and the hero already carries the delivery pill. The dock's whole
    // life is the three sections in between.
    await expect(page.locator(DOCK)).toBeHidden();

    for (const id of ["casa", "fotos", "onde"]) {
      await irPara(page, id);
      await expect(page.locator(DOCK), `visível em #${id}`).toBeVisible();
    }

    await irPara(page, "reservar");
    await expect(page.locator(DOCK), "ainda visível sobre a reserva").toBeHidden();
  });

  test("sai de cena quando um painel de reserva abre", async ({ page }) => {
    // Two forms carry a full-width submit: one in the hero, one in #reservar. The
    // dock has to be gone for both, and it has to be gone BY THE TIME the panel is
    // open — not one observer frame later, which is when a thumb has already landed.
    await existe(page);
    for (const secao of ["hero", "reservar"]) {
      await irPara(page, secao);
      const s = page.locator(`section#${secao}`);
      await s.getByRole("button", { name: /reservar mesa/i }).click();
      await expect(s.getByLabel(/data/i)).toBeVisible();
      await expect(page.locator(DOCK), `painel aberto em #${secao}`).toBeHidden();
    }
  });

  test("escondido, está escondido por visibility — não só por opacity", async ({ page }) => {
    // The invariant the form's scroll maths depends on: it decides whether the dock
    // occludes anything by reading `visibility`. Swap `invisible` for `opacity-0`
    // and that reading starts lying, with nothing else to catch it.
    expect(await visibilidade(page)).toBe("hidden");
  });

  test("escondido, não recebe foco", async ({ page }) => {
    await existe(page);
    const link = page.locator(DOCK).getByRole("link").first();
    await link.focus({ timeout: 2000 }).catch(() => {});
    const focado = await page.evaluate(
      () => !!document.activeElement?.closest("[data-atalhos]"),
    );
    expect(focado, "um link escondido entrou na ordem de tabulação").toBe(false);
  });

  test("com o dock na tela, a página não rola de lado", async ({ page }) => {
    await irPara(page, "fotos");
    await expect(page.locator(DOCK)).toBeVisible();
    const { scroll, cliente } = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      cliente: document.documentElement.clientWidth,
    }));
    expect(scroll).toBeLessThanOrEqual(cliente);
  });

  test.describe("nada que o dedo precisa fica debaixo dele", () => {
    // `trial: true` runs every actionability check INCLUDING the hit target, and
    // fails naming whatever intercepts the pointer. It is precisely the check the
    // existing tests of these buttons do not make: they read boundingBox, and a
    // box can sit in the right place under an overlay.
    test("o botão de enviar, nas duas seções", async ({ page }) => {
      await existe(page);
      await page.setViewportSize({ width: 390, height: 664 });
      for (const secao of ["hero", "reservar"]) {
        await irPara(page, secao);
        const s = page.locator(`section#${secao}`);
        await s.getByRole("button", { name: /reservar mesa/i }).click();
        const enviar = s.getByRole("button", { name: /enviar/i });
        await expect(enviar).toBeVisible();
        await enviar.click({ trial: true });

        const alcancavel = await enviar.evaluate((el) => {
          const b = el.getBoundingClientRect();
          const topo = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
          return topo === el || el.contains(topo!) || (topo?.contains(el) ?? false);
        });
        expect(alcancavel, `algo está sobre o enviar em #${secao}`).toBe(true);
      }
    });

    test("os CTAs e os controles do passa-fotos", async ({ page }) => {
      await existe(page);
      for (const secao of ["hero", "reservar"]) {
        await irPara(page, secao);
        await page
          .locator(`section#${secao}`)
          .getByRole("button", { name: /reservar mesa/i })
          .click({ trial: true });
      }

      await irPara(page, "fotos");
      await expect(page.locator(DOCK)).toBeVisible();
      const ponto = page.locator('section#fotos [data-ponto]').first();
      if ((await ponto.count()) > 0) await ponto.click({ trial: true });
    });
  });

  test.describe("sem JavaScript", () => {
    test.use({ javaScriptEnabled: false });

    test("as duas portas continuam alcançáveis", async ({ page }) => {
      // No observer means nothing can decide, and the page is served with the dock
      // hidden. A <noscript> rule puts it back: whatever the server sends has to be
      // a whole page on its own.
      await page.goto("/");
      const dock = page.locator(DOCK);
      await expect(dock).toBeVisible();
      await expect(dock.getByRole("link", { name: /ifood/i })).toHaveAttribute(
        "href",
        /^https:\/\/www\.ifood\.com\.br\/delivery\/canoas-rs\//,
      );
      await expect(dock.getByRole("link", { name: /como chegar/i })).toHaveAttribute(
        "href",
        /^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=/,
      );
    });
  });
});

test("o dock não é uma sexta seção", async ({ page }) => {
  // The five sections are the frozen scope of this landing. The dock is chrome of
  // the viewport, like the footer — not a place on the page.
  const ids = await page
    .locator("section[id]")
    .evaluateAll((nos) => nos.map((n) => n.id));
  expect(ids).toEqual(["hero", "casa", "fotos", "onde", "reservar"]);

  const dentro = await page.locator(DOCK).evaluate((el) => !!el.closest("section, main"));
  expect(dentro, "o dock está dentro de <main> ou de uma <section>").toBe(false);
});

test("a rota aponta para o endereço que a página imprime", async ({ page }) => {
  test.skip(!preenchido(site.endereco), "sem endereço não há rota");
  const e = site.endereco.valor!;

  const href = await page
    .locator(DOCK)
    .getByRole("link", { name: /como chegar/i })
    .getAttribute("href");

  // The destination is the address the guest reads in #onde, encoded — not a second
  // source of truth free to drift from the text beside it. The separator is Google's
  // own: the short link the house publishes resolves to exactly this string.
  const destino = decodeURIComponent(new URL(href!).searchParams.get("destination")!);
  expect(destino).toContain(e.logradouro);
  expect(destino).toContain(e.bairro);
  expect(destino).toContain(e.cidade);
  expect(destino).toContain(e.cep);
});
