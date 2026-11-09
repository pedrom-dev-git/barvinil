import { site, preenchido } from "@/content/site";
import { urlMapaEmbed } from "@/lib/maps";

/**
 * Where the house is, and when it is open.
 *
 * It used to carry a list of four channels beside the address — WhatsApp,
 * Instagram, the menu, delivery — and that made it a directory rather than an
 * answer. Each of those destinations now comes from where it belongs: the menu from
 * the hero, delivery from the dock, a table from the booking form the WhatsApp was
 * always a step towards. What is left is the one question this section is for, and
 * a map, because an address set in type answers "where is this?" only for someone
 * who already knows the city.
 *
 * `horarioDetalhado` (day by day) is null until the owner gives it, so only the
 * public summary shows. The DER's horario_funcionamento needs the detailed one.
 */
export function OndeQuando() {
  const e = preenchido(site.endereco) ? site.endereco.valor : null;
  const nome = preenchido(site.nomeCompleto) ? site.nomeCompleto.valor : "VINIL";

  return (
    <section
      id="onde"
      aria-labelledby="onde-titulo"
      className="border-t border-areia/25 px-6 py-14 sm:px-10 sm:py-28"
    >
      <div className="mx-auto w-full max-w-md sm:max-w-2xl lg:max-w-4xl">
        <h2
          id="onde-titulo"
          className="font-display text-xs uppercase tracking-marquise text-areia-suave"
        >
          Onde e quando
        </h2>

        {/* Address and hours read as two short blocks side by side from sm up. No
            grid row to match any more, so nothing stretches to anything — which is
            what put 170px of nothing under this column when the map was a square
            pinned beside it. */}
        <div className="mt-8 flex flex-col gap-8 sm:flex-row sm:items-start sm:gap-16">
          {e && (
            <address className="not-italic">
              <p className="font-display text-2xl leading-tight text-areia sm:text-3xl">
                {e.logradouro}
              </p>
              <p className="mt-2 text-base text-areia-suave">
                {e.bairro} · {e.cidade}-{e.uf}
              </p>
              <p className="text-base text-areia-suave">CEP {e.cep}</p>
            </address>
          )}

          {preenchido(site.horarioResumo) && (
            <p className="font-display text-[0.7rem] uppercase tracking-marquise text-areia-suave sm:pt-2">
              {site.horarioResumo.valor}
            </p>
          )}
        </div>

        {e && (
          <a
            href={e.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex min-h-12 items-center rounded-full border border-areia/55 px-7 font-display text-sm uppercase tracking-[0.18em] text-areia transition-colors duration-200 hover:border-areia hover:bg-areia/5"
          >
            {/* The place card, which is what this link has always been. It was "Como
                chegar" while it was the only map on the page; now the dock carries
                the route, and two buttons with the same words is a confusion for the
                guest before it is a trap for a test. */}
            Ver no mapa
          </a>
        )}

        {e && (
          // Full width of the section and wide rather than tall: a square set the
          // height of a grid row and left the column beside it mostly empty, and the
          // thing a map of a bar has to show is the block it sits on, which is a
          // shape wider than it is high.
          <div
            data-mapa
            // ⚠️ The `aspect-*` belongs on the iframe below, NEVER here. This wrapper
            // is `overflow-hidden` for the rounded corners, so giving it the ratio
            // would crop whatever the iframe is taller than — and what sits at the
            // bottom of a Google embed is the attribution strip. Cropping that is the
            // one thing Google's terms forbid in so many words. Guarded in
            // tests/mapa.spec.ts, because measuring this frame's box alone cannot
            // tell a whole map from a clipped one.
            //
            // The border carries more weight than it looks: darkened, the map sits at
            // about 1,05:1 against the page, so this rule is the only edge it has.
            className="mt-8 w-full overflow-hidden rounded-2xl border border-areia/40"
          >
            <iframe
              src={urlMapaEmbed(e)}
              // frame-title is wcag2a: without this the map is announced as "frame",
              // in the one section whose job is to say where the house is. Asserted
              // by hand in tests/mapa.spec.ts as well.
              title={`Mapa com a localização do ${nome}, em ${e.logradouro}`}
              // Loads on its own, without a click, which is what was asked for.
              // `lazy` is a hint and not a promise: measured, Chromium fetched this
              // frame with 2000px of page above it, because the threshold scales with
              // the connection. So read it as "may arrive late on a slow phone",
              // never as "only if the guest scrolls here" — and never as anything
              // resembling consent. What RNF03 gets out of it is a chance.
              loading="lazy"
              // The URL of this page is not Google's business. No `allow`, so the
              // default permissions policy denies the frame geolocation and the rest;
              // no `sandbox`, which would break an embed that needs its own scripts
              // and storage; no `tabindex`, which would strand the frame's focusable
              // content (frame-focusable-content, wcag2a).
              referrerPolicy="no-referrer"
              // Google serves a light map and this page is musgo from top to bottom.
              // Untreated, at this size, the map is the brightest and largest object
              // on the whole landing — louder than the photographs of the house, in a
              // section that is a detail. invert + hue-rotate is the usual way to put
              // a keyless Google map on a dark page: the inversion takes the paper
              // white down to near-black, and the rotation is doing real work, not
              // decoration — without it water turns brown and parkland turns purple.
              //
              // 90% is measured, not chosen by eye (security review, 2026-11-08):
              // street labels keep 8,3:1 against their halo and the attribution 6,0:1
              // against its strip, which is the axis Google's own terms care about.
              // 100% collapses the water and the map stops reading as a map; below
              // 85% the attribution starts failing. And nothing may be stacked on top
              // of this — no opacity, no scrim, no blend mode: the attribution has
              // 6:1 to give and a gradient over the bottom edge would spend it, which
              // turns "recoloured" into "obscured", and that is the clause that bites.
              className="block aspect-[4/3] w-full border-0 [filter:invert(90%)_hue-rotate(180deg)] sm:aspect-[3/1]"
            />
          </div>
        )}
      </div>
    </section>
  );
}
