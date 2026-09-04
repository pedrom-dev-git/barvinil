# barvinil

Site do **VINIL hi-fi bar** — Canoas-RS.

Produto Mínimo Viável desenvolvido na disciplina de **Projeto Integrador Web** (Unilasalle-RS,
2026/2), Grupo 1 "Clube". É um projeto de **extensão universitária**: organização parceira real,
problema real, e um sistema web entregue a ela ao fim do semestre.

**Estado:** landing page. O sistema de reserva de mesa (fluxo do cliente + painel do administrador)
vem em seguida.

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
```

## Onde mexer

| Quero mudar | Arquivo |
|---|---|
| Texto, endereço, telefone, horário | `content/site.ts` |
| Cores e tipografia | `app/globals.css` — bloco `@theme`, é o único lugar com cor |
| Uma seção da página | `components/<Secao>.tsx` |
| Ordem das seções | `app/page.tsx` |

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
