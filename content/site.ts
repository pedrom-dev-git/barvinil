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
    valor: "Onde o som e o sabor se encontram",
    // Wording by Pedro (2026-09-25), from the bio.site line "Onde o som e a
    // gastronomia se encontram" and the brandbook's "som + sabor + espaço".
    // Still unconfirmed by the owner, so it stays `fonte-publica`.
    fonte: BIO_SITE,
    status: "fonte-publica",
  } as Dado<string>,

  /** The line the house section opens with, set large. His words, not ours. */
  descricao: {
    valor: "Um bar onde o tempo desacelera.",
    // Replaces the Instagram wording ("Um refúgio urbano onde o som, o sabor e o
    // espaço se encontram em harmonia"): that one was scraped, this one he wrote.
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
    valor: "Coquetelaria autoral, petiscos e pratos de inspiração italiana.",
    fonte: INSTAGRAM,
    status: "fonte-publica",
  } as Dado<string>,

  programacao: {
    valor: "DJ e noites temáticas ao longo da semana.",
    fonte: INSTAGRAM,
    status: "fonte-publica",
  } as Dado<string>,

  /** The house's own story, in the owner's words. Nobody else can write this. */
  historia: {
    valor:
      "Onde cada faixa em vinil não é trilha de fundo, mas protagonista. Onde o copo " +
      "tem nome, o prato tem história e a arquitetura tem memória. Um sobrado da década " +
      "de 40, com janelas de madeira azul e sacada de ferro, guarda em suas paredes " +
      "texturizadas o mesmo princípio que move o som em vinil: o valor da presença, da " +
      "escuta, do bom gosto. Aqui, cada detalhe arquitetônico é parte da experiência – " +
      "não para mirar o passado, mas para valorizar o presente com densidade, com " +
      "intenção. Não estamos aqui para servir mais do mesmo.",
    fonte: DONO,
    status: "confirmado",
  } as Dado<string>,

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

  cardapio: {
    valor:
      "https://drive.google.com/file/d/1dP45DoZYbP4ycMndidF3iPlfTGRVUieL/view?usp=drivesdk",
    fonte: BIO_SITE,
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
} as const;

/** Every field the owner still has to fill. Rendered by nothing; read by humans. */
export const pendencias = Object.entries(site)
  .filter(([, d]) => (d as Dado<unknown>).status === "a-preencher")
  .map(([chave, d]) => ({ chave, fonte: (d as Dado<unknown>).fonte }));
