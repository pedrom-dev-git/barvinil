import { test, expect } from "@playwright/test";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

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
  expect(
    existsSync(index),
    `${index} does not exist — run \`pnpm test:export\``,
  ).toBe(true);
  return readFileSync(index, "utf8");
}

/** Every root-relative URL the document references. External links are not ours. */
function caminhosAbsolutos(doc: string): string[] {
  const encontrados = [...doc.matchAll(/(?:href|src)="(\/[^"]*)"/g)].map(
    (m) => m[1],
  );
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

  expect(
    caminhos.length,
    "no absolute URLs at all — the export looks empty",
  ).toBeGreaterThan(0);
  expect(caminhos.filter((c) => !c.startsWith(`${BASE}/`))).toEqual([]);
});

test("every asset the page references exists on disk", () => {
  const assets = caminhosAbsolutos(html()).filter((c) =>
    /\.(css|js|woff2?|png|svg|ico)$/.test(c),
  );

  expect(
    assets.length,
    "the page references no stylesheet or script",
  ).toBeGreaterThan(0);

  const faltando = assets.filter(
    (c) => !existsSync(join(OUT, c.slice(BASE.length))),
  );
  expect(faltando, "referenced by index.html but absent from out/").toEqual([]);
});

test("the logo and the favicon ship with the repo, so the deploy wears them", () => {
  // The Pages build runs on a clean clone. A brand file that lives only on someone's
  // disk passes every local test and silently drops off the live page — the hero falls
  // back to type and the tab has no icon. Owner handed them over for this site, 2026-09-25.
  for (const arquivo of ["public/logo-vinil.png", "public/icon.png"]) {
    const rastreado = spawnSync(
      "git",
      ["ls-files", "--error-unmatch", arquivo],
      {
        cwd: join(__dirname, ".."),
      },
    );
    expect(rastreado.status, `${arquivo} is not tracked by git`).toBe(0);
  }

  const doc = html();
  expect(doc).toContain(`${BASE}/logo-vinil.png`);
  expect(doc).toMatch(new RegExp(`rel="icon"[^>]*href="${BASE}/icon\\.png`));
});

test("the page asks search engines to stay away", () => {
  // content/site.ts is mostly `fonte-publica`: address, phone and menu scraped from
  // the bar's public profiles, not confirmed by the owner. Until he signs off, this
  // must not surface in search as the house's official site.
  expect(html()).toMatch(/<meta name="robots" content="[^"]*noindex/);
});

test("robots.txt lets crawlers in, so they can read the noindex", () => {
  // The two do not stack: a crawler blocked by robots.txt never fetches the page, so
  // it never sees the noindex — and Google may still index the bare URL when something
  // links to it, which the public README does. Disallow here would defeat the noindex
  // it is meant to reinforce. Blocking belongs in the meta tag, not in the fetch.
  const robots = join(OUT, "robots.txt");
  expect(existsSync(robots), "out/robots.txt is missing").toBe(true);
  expect(readFileSync(robots, "utf8")).not.toMatch(/^\s*Disallow:\s*\/\s*$/m);
});

test("the five sections are in the exported HTML, not built by the client", () => {
  const doc = html();
  for (const id of SECOES) {
    expect(doc, `section#${id} is not pre-rendered`).toContain(`id="${id}"`);
  }
});
