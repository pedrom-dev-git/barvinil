import { test, expect } from "./fixtures";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The guard that keeps the next spec from being born online.
 *
 * `tests/fixtures.ts` only stubs google.com for the specs that import `test` from
 * it. A new spec that reaches for `@playwright/test` out of habit gets the real
 * network back, silently, and nothing fails until the day the wifi does.
 *
 * Read off the disk rather than asserted about imports at runtime, which is the
 * idiom this suite already uses in prints.spec.ts to prove its own wiring.
 */

/** prints.spec.ts is the one file that must reach the real Google. A screenshot
 *  with a grey square where the map goes is a lie in a slide, and those images go
 *  into the discipline's presentation. */
const ONLINE_DE_PROPOSITO = new Set(["prints.spec.ts"]);

test.describe("wiring", () => {
  test("every spec gets its `test` from ./fixtures, so the suite stays offline", () => {
    const dir = __dirname;
    const specs = readdirSync(dir).filter((f) => f.endsWith(".spec.ts"));
    expect(specs.length, "nenhum spec encontrado").toBeGreaterThan(5);

    const online: string[] = [];
    for (const arquivo of specs) {
      if (ONLINE_DE_PROPOSITO.has(arquivo)) continue;
      const fonte = readFileSync(join(dir, arquivo), "utf8");
      // Looks for the runner coming in through the front door, in any of the shapes
      // that actually reach it. The first version matched exactly one — a named
      // `test` in double quotes — and let single quotes, `test as t`, a namespace
      // import and `require()` through, which is four ways to be online while this
      // test stayed green. Importing a TYPE from @playwright/test is still fine, and
      // most of these files do it, so a bare `import type` is not a hit.
      const alvo = String.raw`['"]@?playwright/test['"]`;
      const padroes = [
        new RegExp(String.raw`import\s*\{[^}]*\btest\b[^}]*\}\s*from\s*${alvo}`),
        new RegExp(String.raw`import\s*\*\s*as\s+\w+\s*from\s*${alvo}`),
        new RegExp(String.raw`require\(\s*${alvo}\s*\)`),
      ];
      if (padroes.some((p) => p.test(fonte))) online.push(arquivo);
    }

    expect(
      online,
      `estes specs pegam o \`test\` do @playwright/test e ficariam online: ${online.join(", ")}`,
    ).toEqual([]);
  });

  test("the stub actually answers for Google — the suite did not go online quietly", async ({
    page,
  }) => {
    // The guard above only proves every spec imports the fixture. It says nothing
    // about whether the fixture still intercepts anything: measured, swapping the
    // route's pattern for one that matches nothing left the whole suite green while
    // every run reached out to google.com for real.
    //
    // So this reads the map frame's own title. "Mapa (stub)" can only come from
    // tests/fixtures.ts; the real embed is titled by Google and, on a network that
    // refuses it, by nothing at all.
    await page.goto("/");
    await page.locator("section#onde").scrollIntoViewIfNeeded();

    await expect
      .poll(() => page.frames().some((f) => f.url().includes("output=embed")), {
        timeout: 10_000,
      })
      .toBe(true);

    const frame = page.frames().find((f) => f.url().includes("output=embed"))!;
    expect(await frame.title(), "o mapa não veio do stub — a suíte está online").toBe(
      "Mapa (stub)",
    );
  });

  test("the file that is online on purpose says so, and is still the only one", () => {
    const fonte = readFileSync(join(__dirname, "prints.spec.ts"), "utf8");
    expect(fonte).toContain('from "@playwright/test"');
    expect([...ONLINE_DE_PROPOSITO]).toEqual(["prints.spec.ts"]);
  });
});
