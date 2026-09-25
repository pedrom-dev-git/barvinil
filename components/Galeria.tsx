import Image from "next/image";
import { site } from "@/content/site";
import { asset } from "@/lib/asset";
import { Sulcos } from "./Sulcos";

/**
 * Photo slots. The house has not sent photos yet (plano-pmv.md §1: "the group does
 * not produce photo, text or logo" — it is the owner's task, with a deadline).
 *
 * Until they arrive each slot renders as a framed groove pattern. It has to read as
 * deliberate texture, not as a broken image, and it must not leak the internal brief
 * onto the page — so `pedido` is never rendered. It lives in ASSETS.md instead.
 */
export function Galeria() {
  const todas = site.fotos.valor ?? [];
  const temFoto = todas.some((f) => f.arquivo !== null);

  // Six empty frames read as a hole in the page. While the house still owes us
  // photos, show one row of three: enough to say "photos go here", not enough to
  // turn the section into a void. All six come back the moment one arrives.
  const fotos = temFoto ? todas : todas.slice(0, 3);

  return (
    <section
      id="fotos"
      aria-labelledby="fotos-titulo"
      className="border-t border-areia/10 px-6 py-20 sm:px-10 sm:py-28"
    >
      <div className="mx-auto w-full max-w-md sm:max-w-2xl lg:max-w-6xl">
        <h2
          id="fotos-titulo"
          className="font-display text-[0.7rem] uppercase tracking-marquise text-areia-suave sm:text-xs"
        >
          O espaço
        </h2>

        {/* On a phone this is a snapping horizontal rail, not a stack: six 4:5 frames
            stacked vertically turn into half a page of dead space while the house
            still owes us photos, and a rail is the better gallery once they land.
            It becomes a grid from sm up, where the vertical room actually exists. */}
        {/* tabIndex + aria-label: a horizontally scrollable region has to be reachable
            by keyboard, or there is no way to see past the first frames without a
            mouse. axe flags this as scrollable-region-focusable, and it is right. */}
        <ul
          tabIndex={0}
          aria-label="Fotos da casa"
          className="-mx-6 mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3"
        >
          {fotos.map((foto) => (
            <li
              key={foto.id}
              className="relative aspect-4/5 w-56 shrink-0 snap-start overflow-hidden rounded-lg border border-areia/10 bg-musgo-claro sm:w-auto"
            >
              {foto.arquivo ? (
                <Image
                  src={asset(`/fotos/${foto.arquivo}`)}
                  alt={foto.alt}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
              ) : (
                <Sulcos className="absolute left-1/2 top-1/2 h-[78%] w-[78%] -translate-x-1/2 -translate-y-1/2 text-areia opacity-[0.22]" />
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
