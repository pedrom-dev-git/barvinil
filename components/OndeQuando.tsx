import { site, preenchido } from "@/content/site";
import { linkWhatsApp } from "@/lib/whatsapp";

/**
 * Address, hours and the three channels the house already uses. Every row is a
 * 48px tap target, which is also why nothing here is an inline link inside prose.
 *
 * `horarioDetalhado` (day by day) is null until the owner gives it, so only the
 * public summary shows. The DER's horario_funcionamento needs the detailed one.
 */
export function OndeQuando() {
  const e = preenchido(site.endereco) ? site.endereco.valor : null;
  const w = preenchido(site.whatsapp) ? site.whatsapp.valor : null;
  const ig = preenchido(site.instagram) ? site.instagram.valor : null;

  const linhas: { rotulo: string; texto: string; href: string }[] = [];
  if (w) {
    linhas.push({
      rotulo: "WhatsApp",
      texto: w.exibicao,
      href: linkWhatsApp(w.e164, "duvida"),
    });
  }
  if (ig) {
    linhas.push({ rotulo: "Instagram", texto: ig.handle, href: ig.url });
  }
  if (preenchido(site.cardapio)) {
    linhas.push({
      rotulo: "Cardápio",
      texto: "Ver o cardápio",
      href: site.cardapio.valor,
    });
  }

  return (
    <section
      id="onde"
      aria-labelledby="onde-titulo"
      className="border-t border-areia/10 px-6 py-20 sm:px-10 sm:py-28"
    >
      <div className="mx-auto w-full max-w-md sm:max-w-2xl lg:max-w-4xl">
        <h2
          id="onde-titulo"
          className="font-display text-[0.7rem] uppercase tracking-marquise text-areia-suave sm:text-xs"
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
                className="mt-7 inline-flex min-h-12 items-center rounded-full border border-areia/35 px-7 font-display text-sm uppercase tracking-[0.18em] text-areia transition-colors duration-200 hover:border-areia hover:bg-areia/5"
              >
                Como chegar
              </a>
            )}
          </div>

          {linhas.length > 0 && (
            <ul className="divide-y divide-areia/10 self-start border-y border-areia/10">
              {linhas.map((l) => (
                <li key={l.rotulo}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-14 items-center justify-between gap-4 py-4 transition-colors duration-200 hover:text-areia-suave"
                  >
                    <span className="font-display text-[0.65rem] uppercase tracking-marquise text-areia-suave">
                      {l.rotulo}
                    </span>
                    <span className="text-base text-areia">{l.texto}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
