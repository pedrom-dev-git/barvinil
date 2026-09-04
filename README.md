# barvinil

Site do **VINIL hi-fi bar** — Canoas-RS. PMV do Projeto Integrador Web (Unilasalle 2026/2, Grupo 1
"Clube"), disciplina de extensão universitária.

Hoje: **landing page** (tela 0). Em seguida: sistema de reserva de mesa (cliente + painel do dono).

## Rodar

```bash
pnpm install
pnpm dev     # http://localhost:3000
```

Node 22+ e pnpm 10. Stack: Next.js 15 (App Router) · TypeScript · Tailwind CSS 4.

## Onde mexer

| Quero mudar | Arquivo |
|---|---|
| Texto, endereço, telefone, horário | `content/site.ts` |
| Cores e tipografia | `app/globals.css` (bloco `@theme`) |
| Uma seção da página | `components/<Secao>.tsx` |
| Ordem das seções | `app/page.tsx` |
| Fotos | `public/fotos/` — ver `ASSETS.md` |

## Estado do conteúdo

Cada campo de `content/site.ts` carrega um `status`. Quase tudo está hoje em `fonte-publica`:
foi coletado do `bio.site/Vinilbar`, do Instagram e do Google Maps, e **não foi confirmado pelo dono**.
Ver `ASSETS.md` e o desk research no repo da disciplina.

## Documentação do projeto

Diagnóstico, requisitos, DER, casos de uso e relatórios ficam em
`~/Desktop/projetos/projeto-integrador-web/` — não aqui.
