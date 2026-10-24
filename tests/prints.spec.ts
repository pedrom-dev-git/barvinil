import { test, expect, type Locator, type Page } from "@playwright/test";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { site, preenchido } from "../content/site";

/**
 * The screenshots the group puts in a presentation, captured by a suite instead of
 * by hand. Item (e) of the presentation asks for "modelos do resultado", and it will
 * ask again — Week 7's user test, the final report, Etapa IV. Doing it by hand means
 * a different crop and a different state every time.
 *
 * Each shot asserts the state it is about to photograph: a panel that failed to open
 * still photographs fine, and a slide built on that print says something false. The
 * assertions are the point; the PNG is the by-product.
 *
 * Not part of `pnpm test:e2e`: it writes outside the repo, into ~/Desktop/media. Two
 * things keep it out — `testIgnore` in playwright.config.ts, and the project-name
 * guard below, which skips every capture unless the prints config is driving.
 */

/** Local YYYY-MM-DD. The run is filed under the day it happened. */
function hojeLocal(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const PASTA =
  process.env.PIW_PRINTS_DIR ??
  join(homedir(), "Desktop", "media", "piw-prints", hojeLocal());

/** Writes the shot and proves it landed — a silent no-write is the failure to catch. */
async function guardar(alvo: Page | Locator, nome: string, opcoes = {}) {
  const caminho = join(PASTA, nome);
  await alvo.screenshot({ path: caminho, ...opcoes });
  expect(existsSync(caminho), `${nome} não foi escrito em ${PASTA}`).toBe(true);
}

/** Fonts loaded and every image decoded: a shot taken before that is a different page. */
async function pronta(page: Page) {
  // No shot is ever caught mid-transition: the booking panel is open or shut, and an
  // open panel looks the same either way.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  // `next dev` floats its own dev-tools badge over the corner of the page. It is not
  // part of the site and it has no business in a slide, so it is hidden here rather
  // than switched off in next.config.ts — the badge is useful while developing.
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await expect(page.locator("nextjs-portal")).toBeHidden();
  await page.evaluate(() => document.fonts.ready);

  // next/image is lazy below the fold, and a fullPage shot does not scroll for us: the
  // gallery could photograph empty. Walk the page once, come back, and then demand
  // that every image actually decoded — `complete` alone is true for one that failed.
  await page.evaluate(() => {
    for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight) {
      window.scrollTo(0, y);
    }
    window.scrollTo(0, 0);
  });
  await page.waitForFunction(() =>
    Array.from(document.images).every((i) => i.complete && i.naturalWidth > 0),
  );
}

/** Opens the booking panel in `secao` and waits for it to be fully open. */
async function abrirReserva(page: Page, secao: string) {
  const s = page.locator(secao);
  await s.getByRole("button", { name: /reservar mesa/i }).click();
  await expect(s.locator("[data-painel-reserva]")).toHaveCSS("opacity", "1");
  await expect(s.getByLabel(/nome/i)).toBeVisible();
}

/** Tomorrow at 20:30, four people — a booking that reads like a real Friday. */
async function preencherReserva(page: Page, secao: string) {
  const s = page.locator(secao);
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const p = (n: number) => String(n).padStart(2, "0");
  const amanha = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;

  await s.locator('input[type="date"]').fill(amanha);
  await expect(s.getByLabel(/data/i)).toHaveValue(/^\d{2}\/\d{2}\/\d{4}/);
  await s.getByLabel(/hora/i).selectOption("20:30");
  await s.getByLabel(/pessoas/i).fill("4");
  await s.getByLabel(/nome/i).fill("Maria Eduarda");
  // The slide claims this booking; the print has to be carrying all four answers.
  await expect(s.getByLabel(/hora/i)).toHaveValue("20:30");
  await expect(s.getByLabel(/pessoas/i)).toHaveValue("4");
  await expect(s.getByLabel(/nome/i)).toHaveValue("Maria Eduarda");
  // Deliberately not submitted: sending leaves for wa.me and there is nothing to
  // photograph there. The filled form is what explains the flow on a slide. The last
  // field keeps the focus ring otherwise, and on a slide that reads as an error state.
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
}

test.describe("wiring", () => {
  test("pnpm prints runs this suite, and pnpm test:e2e does not", () => {
    const raiz = join(__dirname, "..");
    const pkg = JSON.parse(readFileSync(join(raiz, "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts.prints, "package.json precisa do script prints").toBeDefined();
    expect(pkg.scripts.prints).toContain("playwright.prints.config.ts");

    expect(existsSync(join(raiz, "playwright.prints.config.ts"))).toBe(true);

    // The main suite must not reach this file: it writes into ~/Desktop/media.
    const principal = readFileSync(join(raiz, "playwright.config.ts"), "utf8");
    const ignorados = principal.match(/testIgnore:\s*(\[[^\]]*\]|"[^"]*")/)?.[1] ?? "";
    expect(ignorados, "prints.spec.ts precisa estar no testIgnore").toContain("prints.spec.ts");
  });
});

test.describe("prints", () => {
  // Capturing is the prints config's job. Under the main config these skip, so
  // `pnpm test:e2e` never writes a file outside the repo.
  test.beforeEach(() => {
    test.skip(!test.info().project.name.startsWith("prints-"), "rodar via pnpm prints");
  });
  test.skip(!preenchido(site.whatsapp), "no phone number in content/site.ts");

  test.beforeAll(() => mkdirSync(PASTA, { recursive: true }));

  test.describe("celular", () => {
    test.beforeEach(() => test.skip(test.info().project.name !== "prints-mobile"));

    test("01 · topo", async ({ page }) => {
      await pronta(page);
      // The page the customer meets, arriving from Instagram: no sideways scroll.
      const estouro = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(estouro).toBeLessThanOrEqual(0);
      await expect(page.locator("section#hero")).toBeVisible();
      await guardar(page, "01-mobile-topo.png");
    });

    test("02 · página completa", async ({ page }) => {
      await pronta(page);
      for (const id of ["hero", "casa", "fotos", "onde", "reservar"]) {
        await expect(page.locator(`section#${id}`)).toBeAttached();
      }
      // The page says what it is. A print that lost the footer invites the wrong claim.
      await expect(page.getByRole("contentinfo")).toContainText(/prot[óo]tipo/i);
      await guardar(page, "02-mobile-pagina-completa.png", { fullPage: true });
    });

    test("03 · reserva fechada", async ({ page }) => {
      await pronta(page);
      const s = page.locator("section#reservar");
      await expect(s.getByRole("button", { name: /reservar mesa/i })).toHaveAttribute(
        "aria-expanded",
        "false",
      );
      await guardar(s, "03-mobile-reserva-fechada.png");
    });

    test("04 · reserva aberta", async ({ page }) => {
      await pronta(page);
      await abrirReserva(page, "section#reservar");
      // Empty, and looking empty: a field that reads as answered misleads the slide.
      await expect(page.locator("section#reservar").getByLabel(/nome/i)).toHaveValue("");
      await guardar(page.locator("section#reservar"), "04-mobile-reserva-aberta.png");
    });

    test("05 · reserva preenchida", async ({ page }) => {
      await pronta(page);
      await abrirReserva(page, "section#reservar");
      await preencherReserva(page, "section#reservar");
      await guardar(page.locator("section#reservar"), "05-mobile-reserva-preenchida.png");
    });
  });

  test.describe("desktop", () => {
    test.beforeEach(() => test.skip(test.info().project.name !== "prints-desktop"));

    test("06 · topo", async ({ page }) => {
      await pronta(page);
      await expect(page.locator("section#hero")).toBeVisible();
      await expect(page.locator("section#hero").getByRole("button", { name: /reservar mesa/i }))
        .toBeVisible();
      const estouro = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(estouro).toBeLessThanOrEqual(0);
      await guardar(page, "06-desktop-topo.png");
    });

    test("07 · página completa", async ({ page }) => {
      await pronta(page);
      for (const id of ["hero", "casa", "fotos", "onde", "reservar"]) {
        await expect(page.locator(`section#${id}`)).toBeAttached();
      }
      await expect(page.locator("section#fotos li img")).toHaveCount(2);
      await expect(page.getByRole("contentinfo")).toContainText(/prot[óo]tipo/i);
      await guardar(page, "07-desktop-pagina-completa.png", { fullPage: true });
    });

    test("08 · a casa e a galeria", async ({ page }) => {
      await pronta(page);
      // Two photos, and the house still owes four — but the slideshow passes only
      // what exists. An empty frame caught in a print reads as a broken image, not
      // as "em andamento", and the slide has a caption to say that part.
      const molduras = page.locator("section#fotos li");
      await expect(molduras).toHaveCount(2);
      await expect(molduras.locator("img")).toHaveCount(2);

      const casa = await page.locator("section#casa").boundingBox();
      const fotos = await page.locator("section#fotos").boundingBox();
      expect(casa && fotos).toBeTruthy();
      await guardar(page, "08-desktop-a-casa-galeria.png", {
        fullPage: true,
        clip: {
          x: 0,
          y: casa!.y,
          width: casa!.width,
          height: fotos!.y + fotos!.height - casa!.y,
        },
      });
    });

    test("09 · onde e quando", async ({ page }) => {
      await pronta(page);
      const s = page.locator("section#onde");
      // Whatever is still `a-preencher` must not have leaked a marker onto the page.
      await expect(s).not.toContainText("A PREENCHER");
      await guardar(s, "09-desktop-onde-quando.png");
    });

    test("10 · reserva aberta", async ({ page }) => {
      await pronta(page);
      await abrirReserva(page, "section#reservar");
      await preencherReserva(page, "section#reservar");
      await guardar(page.locator("section#reservar"), "10-desktop-reserva-aberta.png");
    });
  });
});
