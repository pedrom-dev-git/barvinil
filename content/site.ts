/**
 * Every piece of text and every fact about the house lives here, and nowhere else.
 *
 * The rule comes from the PIW repo's CLAUDE.md: never state something about the
 * partner organisation that did not come from the partner. So each field carries
 * a `status`:
 *
 *   confirmado    - the owner said it, in a meeting logged in the field diary
 *   fonte-publica - scraped from bio.site / Instagram / Google Maps on 2026-09-04.
 *                   NOT confirmed. Tracked in the discipline repo, at
 *                   etapa1-diagnostico/vinil-fontes-publicas.md
 *   a-preencher   - `valor` is null. Components must not render it.
 *
 * When the owner confirms a field, flip its status and move the `fonte` to the
 * meeting that confirmed it. Nothing here should stay `fonte-publica` by the time
 * the report is handed in.
 */

export type Status = "confirmado" | "fonte-publica" | "a-preencher";

export type Dado<T> = {
  readonly valor: T | null;
  readonly fonte: string;
  readonly status: Status;
};

/**
 * Narrows a `Dado` to one that is safe to put on the page.
 *
 * Checks the status, not just the value. A draft can carry text while still being
 * `a-preencher` — copy the group wrote that the owner has not signed off on — and
 * that is precisely what must not reach a visitor. Checking `valor !== null` alone
 * let one of those through into the rendered page once.
 */
export function preenchido<T>(d: Dado<T>): d is Dado<T> & { valor: T } {
  return d.valor !== null && d.status !== "a-preencher";
}

const BIO_SITE = "bio.site/Vinilbar, consultado em 2026-09-04";
const INSTAGRAM = "Instagram @barvinil, consultado em 2026-09-04";
const MAPS = "Google Maps, via o link do bio.site, consultado em 2026-09-04";
const DONO = "material oficial do dono, entregue via Pedro em 2026-10-30";
/** The house's printed menu — its own words about its own kitchen, by definition. */
const CARDAPIO_2026 =
  "cardápio oficial (menu_VINIL2026_FINAL), entregue via Pedro em 2026-11-05";
/**
 * The iFood storefront, as Pedro found it on 2026-11-06.
 *
 * It could NOT be read from here: the store page answers 403 with a Cloudflare
 * challenge from this machine's network exit, so the URL is recorded as given and
 * nothing on the page was read off it. Confirming the store is the house's, and
 * current, is a sentence in the next conversation with the owner.
 */
const IFOOD = "iFood, informado via Pedro em 2026-11-06 — não verificado (403)";

export type FotoSlot = {
  readonly id: string;
  /** File under public/fotos/, or null while the house has not sent it. */
  readonly arquivo: string | null;
  /** What the photo must show. Doubles as the brief in ASSETS.md. */
  readonly pedido: string;
  readonly alt: string;
};

export const site = {
  nome: {
    valor: "VINIL",
    fonte: BIO_SITE,
    status: "fonte-publica",
  } as Dado<string>,

  nomeCompleto: {
    valor: "VINIL hi-fi bar",
    fonte: BIO_SITE,
    status: "fonte-publica",
  } as Dado<string>,

  tagline: {
    valor: "Onde o tempo desacelera, o copo tem nome e a música tem sabor.",
    // The line the house prints on the welcome page of its own menu. It replaces
    // "Onde o som e o sabor se encontram", which Pedro wrote on 2026-09-25 out of
    // the bio.site wording and the brandbook — a good line, but ours, and the page
    // had been saying it in the house's voice while no one had confirmed it.
    fonte: CARDAPIO_2026,
    status: "confirmado",
  } as Dado<string>,

  /** The line the house section opens with, set large. His words, not ours. */
  descricao: {
    valor: "Não estamos aqui para servir mais do mesmo.",
    // The last line of his manifesto, pulled up to open the section — the sentence
    // he closes on is the one that says what the house is for. It was "Um bar onde
    // o tempo desacelera", which is his too, but the tagline above now carries the
    // menu's "onde o tempo desacelera" and the page was saying it twice.
    fonte: DONO,
    status: "confirmado",
  } as Dado<string>,

  posicionamento: {
    valor: "O primeiro listening bar de Canoas",
    fonte: INSTAGRAM,
    status: "fonte-publica",
  } as Dado<string>,

  /**
   * Category explanation, not a claim about this house. Safe to state; still, the
   * owner should sign off on the wording before this goes in front of customers.
   */
  oQueEUmListeningBar: {
    valor:
      "Num listening bar o som não é fundo: é o prato principal. O disco toca inteiro, " +
      "num sistema montado para ser ouvido, e o salão é desenhado em volta dele — o volume " +
      "deixa espaço para a conversa em vez de disputá-la.",
    fonte: "redação do grupo — PENDENTE de aprovação do dono",
    status: "a-preencher",
  } as Dado<string>,

  cozinha: {
    valor:
      "Tábuas de carne defumada de 8 a 10 horas em lenha de macieira, entradas, " +
      "risotos e hambúrgueres. Coquetelaria autoral, chopp artesanal e vinhos.",
    // Read off the printed menu, which is the house describing its own kitchen. It
    // replaces the Instagram line "Coquetelaria autoral, petiscos e pratos de
    // inspiração italiana" — scraped, and wrong about the backbone of the menu:
    // the italian end is real (arancini, polenta, risotos, caprese) but what the
    // kitchen is built around is smoke.
    fonte: CARDAPIO_2026,
    status: "confirmado",
  } as Dado<string>,

  programacao: {
    valor: "DJ e noites temáticas ao longo da semana.",
    fonte: INSTAGRAM,
    status: "fonte-publica",
  } as Dado<string>,

  /**
   * The house's own story, in the owner's words. Nobody else can write this.
   *
   * One entry per paragraph, and the breaks are the ones he wrote — he sent the
   * manifesto in blocks, and running them together made ~90 unbroken words, which
   * on a phone is sixteen lines nobody reaches the end of.
   */
  historia: {
    valor: [
      "Onde cada faixa em vinil não é trilha de fundo, mas protagonista. Onde o copo " +
        "tem nome, o prato tem história e a arquitetura tem memória.",
      "Um sobrado da década de 40, com janelas de madeira azul e sacada de ferro, " +
        "guarda em suas paredes texturizadas o mesmo princípio que move o som em " +
        "vinil: o valor da presença, da escuta, do bom gosto.",
      "Aqui, cada detalhe arquitetônico é parte da experiência – não para mirar o " +
        "passado, mas para valorizar o presente com densidade, com intenção.",
      "Existimos para quem sabe o valor de ouvir – e de sentir.",
    ],
    // The last line was not in what reached us on 30/10 — it was recovered from the
    // menu the house publishes on its own Drive (Cardapio.pdf, 04/12/2025), whose
    // first page carries this manifesto word for word. Same text, same house, one
    // sentence longer, and it is the one he closes on.
    fonte: DONO,
    status: "confirmado",
  } as Dado<ReadonlyArray<string>>,

  /**
   * The wordmark file, expected at public/<valor>.
   *
   * The hero uses it when the file is there and sets the name in type when it is
   * not, so a checkout without it is never broken — which is also what keeps the
   * page honest if the house ever asks for its mark back.
   */
  logotipo: {
    valor: "logo-vinil.png",
    fonte: "fornecido pelo dono via Rei, 2026-09-04 — marca de terceiro, fora do git",
    status: "confirmado",
  } as Dado<string>,

  /**
   * The reel that plays behind the name, expected at public/video/<valor>.
   *
   * NOT committed, for the same reason as the logo and the photos: it is the house's
   * footage, not ours to publish. Without the file the hero is exactly what it was
   * before — type, the turning record and the booking form — so a clean clone and
   * the deploy are never broken by its absence.
   */
  videoHero: {
    // The bar's own reel of a drink being made, cut to 720p H.264 without audio —
    // ~1,2 MB for 21 s, because it loads on mobile data behind everything else. The
    // kitchen reel is encoded beside it locally as cozinha.mp4 and stays out of the
    // deploy until it is the one chosen; swapping is this line plus the .gitignore.
    valor: "hero.mp4",
    fonte: DONO,
    status: "confirmado",
  } as Dado<string>,

  endereco: {
    valor: {
      logradouro: "R. Cel. Vicente, 126",
      bairro: "Centro",
      cidade: "Canoas",
      uf: "RS",
      cep: "92310-430",
      mapsUrl: "https://maps.app.goo.gl/8cBg5ErwpL6ioQSi6",
    },
    fonte: MAPS,
    status: "fonte-publica",
  } as Dado<{
    logradouro: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
    mapsUrl: string;
  }>,

  whatsapp: {
    valor: { e164: "5551994424243", exibicao: "(51) 99442-4243" },
    fonte: BIO_SITE,
    status: "fonte-publica",
  } as Dado<{ e164: string; exibicao: string }>,

  instagram: {
    valor: { handle: "@barvinil", url: "https://www.instagram.com/barvinil" },
    fonte: INSTAGRAM,
    status: "fonte-publica",
  } as Dado<{ handle: string; url: string }>,

  /**
   * A link, not a page: plano-pmv.md §1 puts "cardápio online" out of scope, and the
   * menu is a designed PDF the house reprints — nothing a landing should be holding
   * a copy of.
   *
   * What matters is that the address never changes. It points at a Drive FILE ID,
   * and Drive lets the owner upload a new version of that same file ("Gerenciar
   * versões"): same id, same link, same QR code on the printed menu, new PDF. So he
   * swaps the menu himself and this page never needs a deploy to follow him.
   *
   * ⚠️ VERIFIED 2026-11-05, and it is OUT OF DATE. The file behind this id is public
   * and downloads without a login — but it is `Cardapio.pdf`, nine pages made in Word
   * on 04/12/2025, not the ten-page designed menu the house sent on 2026-11-05. The
   * prices still match; the document does not. Nothing here can fix that: the owner
   * uploads the new PDF as a new version of this same file and the page follows him.
   */
  cardapio: {
    valor:
      "https://drive.google.com/file/d/1dP45DoZYbP4ycMndidF3iPlfTGRVUieL/view?usp=drivesdk",
    fonte: BIO_SITE,
    status: "fonte-publica",
  } as Dado<string>,

  /**
   * The house's delivery storefront — a link out, like the menu above it.
   *
   * The kitchen's smoked end is on iFood, so "ordering in" is a thing the house
   * sells and this page has to be able to say. It stays a link and nothing more:
   * the orders, the prices and the hours behind it are the marketplace's, and
   * plano-pmv.md §1 keeps the online menu out of scope on the same reasoning.
   *
   * ⚠️ NOT VERIFIED. The storefront answers 403 from here (Cloudflare), so the
   * address is recorded as it was given, unread. Two things need the owner: that
   * the store is his, and that it is still open. Pointing a guest at a dead or
   * someone else's storefront is worse than offering no delivery at all.
   */
  ifood: {
    valor:
      "https://www.ifood.com.br/delivery/canoas-rs/" +
      "carnes-defumadas-vinil-centro/3bc08e06-a427-48a1-8d28-1f281499c199",
    fonte: IFOOD,
    status: "fonte-publica",
  } as Dado<string>,

  /** All the public sources say. Not enough to fill the DER's horario_funcionamento. */
  horarioResumo: {
    valor: "Aberto de terça em diante",
    fonte: INSTAGRAM,
    status: "fonte-publica",
  } as Dado<string>,

  /** Day-by-day opening hours. Required by plano-pmv.md §4; only the owner has it. */
  horarioDetalhado: {
    valor: null,
    fonte: "⟨A PREENCHER: o dono — dia da semana, abre, fecha⟩",
    status: "a-preencher",
  } as Dado<ReadonlyArray<{ dia: string; abre: string; fecha: string }>>,

  fotos: {
    valor: [
      {
        id: "fachada",
        arquivo: null,
        pedido: "Fachada à noite, com a luz acesa. Vira o fundo do topo da página.",
        alt: "Fachada do VINIL hi-fi bar à noite",
      },
      {
        id: "som",
        arquivo: "som.jpg",
        pedido: "O sistema de som — toca-discos e caixas em primeiro plano.",
        alt:
          "Toca-discos ligado atrás de uma tábua de costela, farofa e bolinhos, " +
          "sob o logotipo do VINIL na parede",
      },
      {
        id: "discos",
        arquivo: "discos.jpg",
        pedido: "A parede de discos, ou alguém escolhendo o disco.",
        alt:
          "Mojito ao lado de um disco de vinil sobre a mesa, com o logotipo do " +
          "VINIL iluminado na parede",
      },
      {
        id: "prato",
        arquivo: "prato.jpg",
        pedido: "Um prato da cozinha, bem iluminado.",
        alt:
          "Tábua de costela fumegante com fritas, farofa e linguiça, ao lado de um " +
          "disco de vinil, sob o logotipo do VINIL na parede",
      },
      {
        id: "drink",
        arquivo: "drink.jpg",
        pedido: "Um drink autoral no balcão.",
        alt: "Dois drinks e uma tábua de petiscos numa bandeja, sob luz quente",
      },
      {
        // Not one of the six the brief asked for: the house sent it anyway, and a
        // photograph it chose to send is worth a slot of its own.
        id: "petiscos",
        arquivo: "petiscos.jpg",
        pedido: "Entregue pela casa em 30/10/2026, sem pedido nosso.",
        alt:
          "Seis bolinhos empanados com creme verde sobre uma tábua gravada com o " +
          "logotipo do VINIL, em fundo vermelho",
      },
      {
        id: "salao",
        arquivo: null,
        pedido:
          "O salão à noite. ATENÇÃO: se houver pessoa identificável, exige o ANEXO VI assinado.",
        alt: "Salão do VINIL à noite",
      },
    ] as ReadonlyArray<FotoSlot>,
    // prato, som and discos: the house's own, sent on 2026-10-30 at 1024×1024 —
    // square, so the 4:5 frame crops the sides. drink is still the provisional shot
    // from 2026-09-25 (734×1048, below the 1600px the brief asks for). fachada and
    // salao the house still owes.
    fonte: "⟨A PREENCHER: o dono — o grupo não produz foto (plano-pmv.md §1)⟩",
    status: "a-preencher",
  } as Dado<ReadonlyArray<FotoSlot>>,

  /**
   * The two rooms of the house, standing between the manifesto and the cards.
   *
   * Not part of `fotos` above, and deliberately not named after any of its slots:
   * these do not ride the gallery. The manifesto they close says the house is "um
   * sobrado da década de 40, com janelas de madeira azul e sacada de ferro" — and
   * until now the reader had to take that on trust. These two are what it is
   * describing: the blue-lit window from the inside, and the iron balcony from the
   * open floor above it.
   *
   * ⚠️ TWO THINGS WERE DECIDED AGAINST THE PROJECT'S OWN RULES, BY PEDRO, 2026-11-09.
   *
   * 1. `salao-noite` HAS PEOPLE IN IT — two guests at the back, one behind the strip
   *    curtain. The `salao` slot above says in so many words that an identifiable
   *    person requires the signed ANEXO VI, and that release is still an open 🔴 item
   *    in the course repo's BACKLOG.md. Published anyway, knowingly. If anyone objects,
   *    the fix is to drop the two lines in ACasa.tsx that render this one — the file is
   *    in git, so removing it from the page is one commit.
   * 2. BOTH ARE BELOW SPEC. ASSETS.md asks for 1600px on the short side; these are
   *    960 (salao-noite) and 1200 (terraco). With images.unoptimized there is no
   *    srcset, so the browser gets the file as it is and a retina phone renders them
   *    soft — the same defect already noted for `drink` above. They were accepted as
   *    they are; replacing either one is dropping a better file over the same name.
   *
   * Status is `a-preencher` and they render anyway, exactly as `fotos` above does
   * (Galeria.tsx:19 is the same bypass). The provenance of these two files was not
   * recorded and Pedro waived it, so the honest thing is a field that still counts as
   * pending rather than a `fonte` that claims something nobody checked.
   */
  ambientes: {
    valor: [
      {
        id: "salao-noite",
        arquivo: "salao-noite.jpg",
        pedido: "O salão à noite, visto de dentro. Fecha o manifesto em #casa.",
        alt:
          "Salão à noite, com a janela iluminada de azul, discos de vinil " +
          "pendurados e uma bola de espelhos sobre as mesas",
      },
      {
        id: "terraco",
        arquivo: "terraco.jpg",
        pedido: "A área de cima, aberta. Fecha o manifesto em #casa.",
        alt:
          "Área de cima ao entardecer, com móveis de pallet sobre grama " +
          "sintética, varal de lâmpadas e a cidade ao fundo",
      },
    ] as ReadonlyArray<FotoSlot>,
    fonte: "⟨A PREENCHER: quem fotografou — arquivos entregues via Pedro em 2026-11-09⟩",
    status: "a-preencher",
  } as Dado<ReadonlyArray<FotoSlot>>,
} as const;

/** Every field the owner still has to fill. Rendered by nothing; read by humans. */
export const pendencias = Object.entries(site)
  .filter(([, d]) => (d as Dado<unknown>).status === "a-preencher")
  .map(([chave, d]) => ({ chave, fonte: (d as Dado<unknown>).fonte }));
