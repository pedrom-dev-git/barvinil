import Image from "next/image";
import { site, preenchido } from "@/content/site";
import { asset } from "@/lib/asset";

/**
 * Each room's own shape, by slot id.
 *
 * Spelled out rather than derived, for the reason PassaFotos.tsx states about its
 * LARGURA table: Tailwind reads this file as text, and a class assembled at runtime is
 * a class that was never generated.
 *
 * ⚠️ These have to match what the files actually are — 1280×960 and 1200×1600 today.
 * Drop a differently shaped photograph over either name and the frame will crop it
 * silently, because the frame takes its ratio from here and not from the image. The
 * spec measures the rendered box, so it would not catch that on its own; what catches
 * it is looking at the page.
 */
const PROPORCAO: Record<string, string> = {
  "salao-noite": "aspect-[4/3]",
  terraco: "aspect-[3/4]",
};

/**
 * Only the house's own public words go here. `oQueEUmListeningBar` is drafted by
 * the group and still marked `a-preencher`, so it does not render: putting unapproved
 * copy in the owner's mouth is exactly what the PIW rule forbids. When he signs off,
 * flip the status in content/site.ts and it appears — no change needed here.
 */
export function ACasa() {
  const cartoes = [
    { chave: "som", rotulo: "O som", dado: site.oQueEUmListeningBar },
    { chave: "cozinha", rotulo: "A cozinha", dado: site.cozinha },
    { chave: "programacao", rotulo: "A programação", dado: site.programacao },
  ].filter(({ dado }) => preenchido(dado));

  // Read straight off the field, without preenchido(), and the same deliberate bypass
  // Galeria.tsx:19 makes for site.fotos: the status stays `a-preencher` because nobody
  // recorded who took these, which is a pending fact about provenance and not a reason
  // to leave the page without them. A slot whose file is null still renders nothing,
  // because there would be no src to give.
  const ambientes = (site.ambientes.valor ?? []).filter((foto) => foto.arquivo);

  // Cards disappear as long as the owner has not approved their copy, so the column
  // count follows what is left instead of leaving a hole in a fixed 3-up grid. They
  // are separated by rules, not boxed: a box filled with the page colour shows only
  // its padding, and reads as a stray indent.
  const colunas = cartoes.length >= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";

  return (
    <section
      id="casa"
      aria-labelledby="casa-titulo"
      className="border-t border-areia/25 px-6 py-14 sm:px-10 sm:py-28"
    >
      <div className="mx-auto w-full max-w-md sm:max-w-2xl lg:max-w-4xl">
        {preenchido(site.posicionamento) && (
          <h2
            id="casa-titulo"
            className="font-display text-xs uppercase tracking-marquise text-areia-suave"
          >
            {site.posicionamento.valor}
          </h2>
        )}

        {preenchido(site.descricao) && (
          <p className="mt-7 font-display text-[1.6rem] leading-[1.35] text-areia sm:text-3xl lg:text-4xl">
            {site.descricao.valor}
          </p>
        )}

        {preenchido(site.historia) && (
          // His paragraphs, kept apart. space-y rather than a margin on each one, so
          // the gap between them is a single decision and the first still hangs off
          // the display line above by the mt-8 this block owns.
          <div className="mt-8 max-w-prose space-y-4 text-base leading-relaxed text-areia-suave">
            {site.historia.valor.map((paragrafo) => (
              <p key={paragrafo.slice(0, 32)}>{paragrafo}</p>
            ))}
          </div>
        )}

        {ambientes.length > 0 && (
          // The two rooms, where the manifesto ends. The paragraph that closes just
          // above claims a 1940s house with blue wooden windows and an iron balcony,
          // and until these arrived that was a thing the page asserted and never
          // showed.
          //
          // Proportional columns, not equal ones: one photograph is landscape and the
          // other portrait, and 1.78 is (4/3) ÷ (3/4) — the ratio at which the two
          // bottoms meet on their own. No fixed height, no common frame, so neither is
          // cropped. The blue window runs the full width of the first one, which is
          // exactly what a shared 4:5 frame would have cut off.
          <div data-ambientes className="mt-8 grid gap-4 sm:grid-cols-[1.78fr_1fr]">
            {ambientes.map((foto) => (
              <div
                key={foto.id}
                className={`relative overflow-hidden rounded-lg border border-areia/25 bg-musgo-claro ${PROPORCAO[foto.id]}`}
              >
                <Image
                  src={asset(`/fotos/${foto.arquivo}`)}
                  alt={foto.alt}
                  fill
                  // Inert today — images.unoptimized means no srcset is generated and
                  // the browser gets the file as it is. Written correctly anyway, so
                  // that turning optimization on is a config change and not a hunt.
                  sizes="(min-width: 1024px) 573px, (min-width: 640px) 430px, 100vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {cartoes.length > 0 && (
          // Ruled above as well as between: divide-y alone drew a line between the
          // two cards and none over the first, so the first read as something that
          // had come loose rather than as one of a pair.
          <dl
            className={`mt-10 grid border-t border-areia/25 divide-y divide-areia/25 sm:divide-x sm:divide-y-0 ${colunas}`}
          >
            {cartoes.map(({ chave, rotulo, dado }) => (
              <div key={chave} className="py-7 sm:px-8 sm:pt-8 sm:pb-0 sm:first:pl-0">
                <dt className="font-display text-[0.7rem] uppercase tracking-marquise text-areia-suave">
                  {rotulo}
                </dt>
                <dd className="mt-3 text-base leading-relaxed text-areia">
                  {dado.valor}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}
