import { site, preenchido } from "@/content/site";

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

  // Cards disappear as long as the owner has not approved their copy, so the column
  // count follows what is left instead of leaving a hole in a fixed 3-up grid. They
  // are separated by rules, not boxed: a box filled with the page colour shows only
  // its padding, and reads as a stray indent.
  const colunas = cartoes.length >= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";

  return (
    <section
      id="casa"
      aria-labelledby="casa-titulo"
      className="border-t border-areia/10 px-6 py-20 sm:px-10 sm:py-28"
    >
      <div className="mx-auto w-full max-w-md sm:max-w-2xl lg:max-w-4xl">
        {preenchido(site.posicionamento) && (
          <h2
            id="casa-titulo"
            className="font-display text-[0.7rem] uppercase tracking-marquise text-areia-suave sm:text-xs"
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
          <p className="mt-8 max-w-prose text-base leading-relaxed text-areia-suave">
            {site.historia.valor}
          </p>
        )}

        {cartoes.length > 0 && (
          <dl
            className={`mt-14 grid divide-y divide-areia/10 sm:divide-x sm:divide-y-0 ${colunas}`}
          >
            {cartoes.map(({ chave, rotulo, dado }) => (
              <div key={chave} className="py-8 first:pt-0 sm:px-8 sm:py-0 sm:first:pl-0">
                <dt className="font-display text-[0.65rem] uppercase tracking-marquise text-areia-suave">
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
