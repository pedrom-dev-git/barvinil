import { test, expect } from "@playwright/test";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * The landing page is served by GitHub Pages out of a project subdirectory, so its
 * public root is /barvinil and not /. Every absolute URL Next writes into the HTML
 * has to carry that prefix, or the page arrives unstyled — the classic Pages failure,
 * and one no browser test catches locally, where the site does sit at the root.
 *
 * These assertions run against the exported files, before anything is deployed.
 */

const OUT = join(__dirname, "..", "out");
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/barvinil";

/** The five sections plano-pmv.md §1 fixed. Same list as landing.spec.ts. */
const SECOES = ["hero", "casa", "fotos", "onde", "reservar"] as const;

function html(): string {
  const index = join(OUT, "index.html");
  expect(existsSync(index), `${index} does not exist — run \`pnpm test:export\``).toBe(true);
  return readFileSync(index, "utf8");
}

/** Every root-relative URL the document references. External links are not ours. */
function caminhosAbsolutos(doc: string): string[] {
  const encontrados = [...doc.matchAll(/(?:href|src)="(\/[^"]*)"/g)].map((m) => m[1]);
  return [...new Set(encontrados)];
}

test("the export lands in out/, with the .nojekyll Pages needs", () => {
  expect(existsSync(join(OUT, "index.html"))).toBe(true);
  // Jekyll skips directories starting with an underscore, and Next puts every asset
  // in _next/. Without this file the deploy succeeds and the page has no CSS.
  expect(existsSync(join(OUT, ".nojekyll"))).toBe(true);
});

test("every absolute URL is prefixed with the base path", () => {
  const caminhos = caminhosAbsolutos(html());

  expect(caminhos.length, "no absolute URLs at all — the export looks empty").toBeGreaterThan(0);
  expect(caminhos.filter((c) => !c.startsWith(`${BASE}/`))).toEqual([]);
});

test("every asset the page references exists on disk", () => {
  const assets = caminhosAbsolutos(html()).filter((c) => /\.(css|js|woff2?|png|svg|ico)$/.test(c));

  expect(assets.length, "the page references no stylesheet or script").toBeGreaterThan(0);

  const faltando = assets.filter((c) => !existsSync(join(OUT, c.slice(BASE.length))));
  expect(faltando, "referenced by index.html but absent from out/").toEqual([]);
});

test("the page asks search engines to stay away", () => {
  // content/site.ts is mostly `fonte-publica`: address, phone and menu scraped from
  // the bar's public profiles, not confirmed by the owner. Until he signs off, this
  // must not surface in search as the house's official site.
  expect(html()).toMatch(/<meta name="robots" content="[^"]*noindex/);

  const robots = join(OUT, "robots.txt");
  expect(existsSync(robots), "out/robots.txt is missing").toBe(true);
  expect(readFileSync(robots, "utf8")).toMatch(/^\s*Disallow:\s*\/\s*$/m);
});

test("the five sections are in the exported HTML, not built by the client", () => {
  const doc = html();
  for (const id of SECOES) {
    expect(doc, `section#${id} is not pre-rendered`).toContain(`id="${id}"`);
  }
});
