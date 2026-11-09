# barvinil

Site do **VINIL hi-fi bar** — Canoas-RS.

Produto Mínimo Viável desenvolvido na disciplina de **Projeto Integrador Web** (Unilasalle-RS,
2026/2), Grupo 1 "Clube". É um projeto de **extensão universitária**: organização parceira real,
problema real, e um sistema web entregue a ela ao fim do semestre.

**Estado:** landing page. O sistema de reserva de mesa (fluxo do cliente + painel do administrador)
vem em seguida.

**No ar:** <https://pedrom-dev-git.github.io/barvinil/> — publicado a cada push na `main`
(`.github/workflows/deploy.yml`). A página sai **`noindex`**, de propósito: quase todo campo de
`content/site.ts` ainda é `fonte-publica`, e isto não pode aparecer na busca como o site oficial da
casa antes de o dono aprovar o conteúdo. Quando aprovar, é tirar `robots` do `app/layout.tsx`.

O `public/robots.txt` **permite** o rastreamento, e isso é intencional: os dois não se somam. Um
crawler barrado por `Disallow: /` nunca busca a página, logo nunca lê o `noindex` — e a URL segue
indexável como link nu. Quem desindexa é a meta tag.

## Rodar

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

Node 22+ e pnpm 10. Stack: Next.js 15 (App Router) · TypeScript · Tailwind CSS 4.

```bash
pnpm build      # build de produção
pnpm lint
pnpm typecheck
pnpm test:e2e   # Playwright — viewport mobile é o projeto padrão
pnpm test:export # build estático do Pages + as asserções sobre out/
pnpm prints     # prints de apresentação em ~/Desktop/media/piw-prints/<hoje>/
```

`pnpm prints` é a captura das telas que entram em apresentação e relatório. Roda fora do
`pnpm test:e2e` de propósito — escreve fora do repo, e os prints carregam as fotos da casa.
Cada shot afirma o estado antes de fotografar; destino alternativo em `PIW_PRINTS_DIR`.

O GitHub Pages serve o repo a partir de `/barvinil`, e não da raiz de um domínio. Por isso o build
do deploy roda com `NEXT_PUBLIC_BASE_PATH=/barvinil` e todo arquivo de `public/` é referenciado via
`asset()` (`lib/asset.ts`) — o `next/image` deixa de aplicar o base path quando
`images.unoptimized` está ligado, que o export exige. `tests/export.spec.ts` reprova qualquer URL
absoluta que escape disso; é o erro que publica verde e entrega a página sem estilo.

## Onde mexer

| Quero mudar | Arquivo |
|---|---|
| Texto, endereço, telefone, horário | `content/site.ts` |
| Cores e tipografia | `app/globals.css` — bloco `@theme`, é o único lugar com cor |
| Uma seção da página | `components/<Secao>.tsx` |
| Ordem das seções | `app/page.tsx` |
| A barra de atalhos do celular | `components/Atalhos.tsx` |
| URLs do Google Maps (rota e embed) | `lib/maps.ts` — derivadas do endereço, sem campo próprio |

## O mapa e a suíte offline

A seção **Onde e quando** tem um quadrado com o mapa — um `<iframe>` servido pela Google, carregado
sem clique. Três coisas que decorrem disso e que ninguém adivinha lendo o componente:

**É o único contato com terceiro que a página faz sozinha.** Todo o resto que sai daqui — WhatsApp,
iFood, cardápio, Instagram — é link que o visitante escolhe tocar, e as fontes são auto-hospedadas
no build. O mapa não: ele carrega no load, e a Google recebe IP, dados do dispositivo, os cookies de
`google.com` que o visitante já tenha, e a origem desta página via `location.ancestorOrigins` — que
o `referrerpolicy="no-referrer"` **não** cobre (ele esconde *qual página*, não *qual site*). Por isso
o rodapé diz isso ao visitante: o README não é lido por quem está sendo medido. `loading="lazy"` é
dica e não promessa — medido, o Chromium busca o frame com 2000 px de página acima dele.

**A URL não tem chave de API, e isso é escolha.** A Maps Embed API oficial também é gratuita; ela só
exige chave — e a chave teria de viver num repo público, compartilhada por seis pessoas durante um
semestre. A forma `output=embed` é a que não tem segredo nenhum. Ela é indocumentada: redireciona
para `/maps/embed?origin=mfe&pb=…`, o mesmo endpoint que o diálogo "Compartilhar → Incorporar" da
própria Google entrega, mas pode sumir sem aviso. Se sumir, o quadrado fica vazio e **nenhum teste
avisa** — o botão "Ver no mapa" ao lado é o caminho que continua funcionando.

**A suíte é offline por contrato.** `tests/fixtures.ts` intercepta `google.com/maps` com um stub, e
todo spec importa o `test` de lá; `tests/fixtures.spec.ts` reprova quem importar do
`@playwright/test` e ficar online. A exceção é `tests/prints.spec.ts`, que precisa da Google real —
um quadrado cinza é mentira num slide.

⚠️ **O mapa está por verificar num browser.** Desta máquina a Google devolve
`net::ERR_CONNECTION_ABORTED` a um Chromium real nessa URL (o `curl` recebe 200 do mesmo host), então
o print 09 pula com essa mensagem em vez de reprovar. O endereço resolve certo — o documento do embed
traz o lugar em `-29.9191, -51.1836`, que é a Rua Coronel Vicente, Centro, Canoas, e o OpenStreetMap
concorda. Se o quadrado pintar aí, está tudo no lugar; se não pintar, o problema é rede, não endereço.

## O dock de atalhos

No celular, uma barra fixa no pé com **Como chegar** e **Pedir no iFood** (`components/Atalhos.tsx`).
Ela vive em `app/layout.tsx`, irmã de `<main>`, e isso é estrutural: `position: fixed` dentro de um
ancestral com `transform` deixa de ser fixo, e a classe `.revelar` põe `transform` em toda
`main section`.

Ela sai de cena em três lugares — sobre o hero, sobre `#reservar` e sobre o rodapé — porque uma barra
fixa no pé do telefone fica exatamente onde esta página põe os botões de enviar. A regra do painel
aberto é **CSS** e não JavaScript (`body:has([data-painel-reserva]:not([inert]))`): o
`IntersectionObserver` é assíncrono e a checagem de ponteiro do browser não espera por ele.

## Duas decisões que explicam o código

**Mobile-first não é figura de linguagem.** O estilo base é o viewport pequeno e `sm:`/`md:`/`lg:`
apenas acrescentam. O Playwright roda 390×844 como projeto padrão, com testes que travam scroll
lateral e alvo de toque de 44 px. Por isso não existe link inline dentro de parágrafo em lugar
nenhum: todo link é um alvo de toque de 48 px.

**Nenhum dado sobre a casa é afirmado sem procedência.** Cada campo de `content/site.ts` carrega um
`status` — `confirmado`, `fonte-publica` ou `a-preencher` — e o que não está confirmado simplesmente
não renderiza. Há teste que falha se um rascunho não aprovado chegar à página.

## Assets da marca

O logotipo e as fotos do bar **não estão neste repositório** — são propriedade da casa. O site
funciona sem eles: o topo compõe o nome tipograficamente e a galeria mostra molduras. Para usar os
arquivos reais, coloque `logo-vinil.png` em `public/` e as fotos em `public/fotos/`, e aponte cada
uma no `content/site.ts`.

## Licença

Ainda não definida. Enquanto isso, todos os direitos reservados — e o logotipo, a marca e as fotos
do VINIL hi-fi bar permanecem propriedade da casa em qualquer cenário.
