/**
 * Says what this page is, to whoever was simply handed the link.
 *
 * The copy lives here and not in content/site.ts on purpose: site.ts holds facts
 * about the house, each one carrying a `status` that says who confirmed it. This is
 * a statement about the group and the discipline — nothing here is a claim about the
 * bar, so it has no provenance to track.
 *
 * It comes out when the owner approves the content of site.ts and the last
 * `fonte-publica` is gone. Until then the page is published, indexable only by
 * accident, and must not read as the house's official site.
 *
 * No link: every tap target inside a section has to clear 44px (RNF01), and a line
 * of small print is not a target. Plain text keeps it out of that budget.
 */
export function Rodape() {
  return (
    <footer className="border-t border-areia/10 px-6 py-10 sm:px-10">
      <p className="mx-auto max-w-md text-[0.7rem] leading-relaxed text-areia-suave sm:max-w-2xl lg:max-w-4xl">
        Protótipo acadêmico do Projeto Integrador Web — Unilasalle-RS, 2026/2. Não é o site
        oficial do VINIL hi-fi bar, e as informações desta página ainda não foram confirmadas
        pela casa.
      </p>
    </footer>
  );
}
