/**
 * Prefixes a file in public/ with the deploy's base path.
 *
 * Next rewrites the URLs it generates itself — routes, the _next/ bundle — with
 * `basePath`, and next/image normally does the same. It does NOT once
 * `images.unoptimized` is on, which the static export requires: the loader then hands
 * the src straight back. So a `/logo-vinil.png` written by hand resolves at the root
 * of the domain and 404s under GitHub Pages, where the site lives at /barvinil.
 *
 * Every reference to a file in public/ goes through here. tests/export.spec.ts fails
 * on any absolute URL in the exported HTML that skipped it.
 */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** @param caminho root-relative path of a file in public/, e.g. "/fotos/salao.jpg" */
export function asset(caminho: string): string {
  return `${BASE}${caminho}`;
}
