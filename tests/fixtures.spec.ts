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
      // Looks for the import of `test` specifically: importing a type from
      // @playwright/test is fine, and several of these files do.
      if (/import\s*\{[^}]*\btest\b[^}]*\}\s*from\s*"@playwright\/test"/.test(fonte)) {
        online.push(arquivo);
      }
    }

    expect(
      online,
      `estes specs pegam o \`test\` do @playwright/test e ficariam online: ${online.join(", ")}`,
    ).toEqual([]);
  });

  test("the file that is online on purpose says so, and is still the only one", () => {
    const fonte = readFileSync(join(__dirname, "prints.spec.ts"), "utf8");
    expect(fonte).toContain('from "@playwright/test"');
    expect([...ONLINE_DE_PROPOSITO]).toEqual(["prints.spec.ts"]);
  });
});
