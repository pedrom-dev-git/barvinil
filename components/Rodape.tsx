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
 *
 * The second paragraph is the page telling the visitor what it does to them, and it
 * is here because this is the only place on the page that addresses the visitor
 * rather than describing the house. The map in #onde is a document served by Google,
 * loaded without being asked for, so Google receives the visitor's IP, their
 * device's details, whatever google.com cookies they already carry, and — through
 * `location.ancestorOrigins`, which `referrerpolicy` does not cover — the origin
 * this page is served from. Until this map existed the published page made no
 * third-party request at all, which is why one sentence is the floor and not a
 * formality. A line in the README does not reach the person it is about.
 */
export function Rodape() {
  return (
    <footer className="border-t border-areia/25 px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-md space-y-3 text-xs leading-relaxed text-areia-suave sm:max-w-2xl lg:max-w-4xl">
        <p>
          Protótipo acadêmico do Projeto Integrador Web — Unilasalle-RS, 2026/2. Não é o site
          oficial do VINIL hi-fi bar, e as informações desta página ainda não foram confirmadas
          pela casa.
        </p>
        <p data-aviso-terceiros>
          O mapa desta página é carregado dos servidores do Google, que recebe o seu endereço
          de IP, dados do seu dispositivo e os cookies de google.com que você já tenha. Nada é
          coletado ou armazenado por nós.
        </p>
      </div>
    </footer>
  );
}
