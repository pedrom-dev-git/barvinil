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

        <div className="mt-8 grid gap-12 sm:grid-cols-2 sm:gap-10">
          <div>
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
              <p className="mt-6 font-display text-[0.7rem] uppercase tracking-marquise text-areia-suave">
                {site.horarioResumo.valor}
              </p>
            )}

            {e && (
              <a
                href={e.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-flex min-h-12 items-center rounded-full border border-areia/55 px-7 font-display text-sm uppercase tracking-[0.18em] text-areia transition-colors duration-200 hover:border-areia hover:bg-areia/5"
              >
                {/* The place card, which is what this link has always been. It was
                    "Como chegar" while it was the only map on the page; now the dock
                    carries the route, and two buttons with the same words is a
                    confusion for the guest before it is a trap for a test. */}
                Ver no mapa
              </a>
            )}
          </div>

          {e && (
            // `max-w-sm` and not the column: at lg the grid cell is ~428px wide, and
            // a square that size is the loudest thing in the section — louder than
            // the address it is there to illustrate. `self-start` so the grid does
            // not stretch it, which for a square means stretching it out of square.
            <div
              data-mapa
              className="w-full max-w-sm self-start overflow-hidden rounded-2xl border border-areia/25"
            >
              <iframe
                src={urlMapaEmbed(e)}
                // frame-title is wcag2a: without this the map is announced as
                // "frame", in the one section whose job is to say where the house is.
                // It is asserted by hand in tests/mapa.spec.ts, because the a11y gate
                // excludes iframes and can no longer check it.
                title={`Mapa com a localização do ${nome}, em ${e.logradouro}`}
                // Loads on its own, without a click, which is what was asked for.
                // `lazy` is a hint and not a promise: measured, Chromium fetched this
                // frame with 2000px of page above it, because the threshold scales
                // with the connection. So read it as "may arrive late on a slow
                // phone", never as "only if the guest scrolls here" — and never as
                // anything resembling consent. What RNF03 gets out of it is a chance,
                // not a guarantee.
                loading="lazy"
                // The URL of this page is not Google's business. No `allow`, so the
                // default permissions policy denies the frame geolocation and the
                // rest; no `sandbox`, which would break an embed that needs its own
                // scripts and storage; no `tabindex`, which would strand the frame's
                // focusable content (frame-focusable-content, wcag2a).
                referrerPolicy="no-referrer"
                className="block aspect-square w-full border-0"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
