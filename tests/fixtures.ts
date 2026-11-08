import { test as base, expect } from "@playwright/test";

/**
 * The suite is offline, and it has to stay that way.
 *
 * Everything this landing page needs is served by the dev server. The one exception
 * is the map in #onde, which is an iframe of Google's — and without this fixture
 * every `page.goto("/")` in nine spec files, across two projects, becomes a real
 * request to google.com. That is a few hundred network calls on a suite that has
 * never needed one, and it is the kind of dependency that turns a red run into a
 * question about the wifi.
 *
 * Routed on the CONTEXT and not on the page, so it also catches the iframe's own
 * subresources and anything it tries to open.
 *
 * The stub is a well-formed document WITH a `lang`. A bare body would fabricate an
 * `html-has-lang` violation inside the frame, and axe — which recurses into child
 * frames — would bill us for it.
 */
export const test = base.extend<{ semRede: void }>({
  semRede: [
    async ({ context }, use) => {
      await context.route(/^https:\/\/(www\.|maps\.)?google\.com\/maps/, (rota) =>
        rota.fulfill({
          status: 200,
          contentType: "text/html",
          body:
            '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
            "<title>Mapa (stub)</title></head><body></body></html>",
        }),
      );
      await use();
    },
    { auto: true },
  ],
});

export { expect };
