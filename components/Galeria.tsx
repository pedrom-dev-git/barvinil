import { existsSync } from "node:fs";
import { join } from "node:path";
import { site } from "@/content/site";
import { asset } from "@/lib/asset";
import { PassaFotos, type Quadro } from "./PassaFotos";

/**
 * Photo slots. The house has not sent all the photos yet (plano-pmv.md §1: "the group
 * does not produce photo, text or logo" — it is the owner's task, with a deadline).
 *
 * Until they arrive each slot renders as a framed groove pattern. It has to read as
 * deliberate texture, not as a broken image, and it must not leak the internal brief
 * onto the page — so `pedido` is never rendered. It lives in ASSETS.md instead.
 *
 * This half stays on the server because the file check below is a build-time fact;
 * the passing itself is the browser's job, in PassaFotos.
 */
export function Galeria() {
  const todas = site.fotos.valor ?? [];

  // Server component, so this is a build-time check. Photos are the house's and stay
  // out of git: a slot can name a file this checkout does not have (the deploy, for
  // one), and that slot has to stay an empty frame rather than a broken image.
  const temArquivo = (arquivo: string | null): arquivo is string =>
    arquivo !== null && existsSync(join(process.cwd(), "public", "fotos", arquivo));

  // Only photos ride the rail. One frame is on screen at a time here, so an empty
  // slot is not texture beside two photos the way it was in the old grid — it is a
  // whole screen of nothing that the clock walks the guest into, and it reads as an
  // image that failed to load. The groove frames are for having no photos at all,
  // where three of them say "photos go here".
  const comFoto = todas.filter((f) => temArquivo(f.arquivo));
  const vazios = todas.filter((f) => !temArquivo(f.arquivo));
  const quadros: Quadro[] = [...comFoto, ...vazios].slice(0, comFoto.length || 3).map((f) => ({
    id: f.id,
    src: temArquivo(f.arquivo) ? asset(`/fotos/${f.arquivo}`) : null,
    alt: f.alt,
  }));

  return (
    <section
      id="fotos"
      aria-labelledby="fotos-titulo"
      className="border-t border-areia/10 px-6 py-20 sm:px-10 sm:py-28"
    >
      <div className="mx-auto w-full max-w-md sm:max-w-2xl lg:max-w-4xl">
        <h2
          id="fotos-titulo"
          className="font-display text-[0.7rem] uppercase tracking-marquise text-areia-suave sm:text-xs"
        >
          O espaço
        </h2>

        <PassaFotos quadros={quadros} />
      </div>
    </section>
  );
}
