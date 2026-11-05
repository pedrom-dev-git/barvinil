import { existsSync } from "node:fs";
import { join } from "node:path";
import Image from "next/image";
import { site, preenchido } from "@/content/site";
import { asset } from "@/lib/asset";
import { Botao } from "./Botao";
import { FundoVideo } from "./FundoVideo";
import { FormReserva } from "./FormReserva";
import { Sulcos } from "./Sulcos";

/**
 * The mark IS the name, so the h1 is the wordmark image rather than the name set
 * in some other typeface. Its alt text carries the accessible name.
 */
export function Hero() {
  const nome = preenchido(site.nomeCompleto) ? site.nomeCompleto.valor : "Vinil";

  // Server component, so this is a build-time check. The logo file is deliberately
  // not in the repository (it is the bar's trademark), so the page has to stand up
  // without it — the name is set in type instead, in the brand's Gorga Grotesque.
  const temLogo =
    preenchido(site.logotipo) &&
    existsSync(join(process.cwd(), "public", site.logotipo.valor));
  // Same build-time check as the logo: the hero has to read as finished with no
  // footage at all, because which reel is published is a decision that changes.
  const temVideo =
    preenchido(site.videoHero) &&
    existsSync(join(process.cwd(), "public", "video", site.videoHero.valor));
  const cidade = preenchido(site.endereco)
    ? `${site.endereco.valor.cidade} · ${site.endereco.valor.uf}`
    : null;

  const cardapio = preenchido(site.cardapio) ? (
    <Botao href={site.cardapio.valor} externo className="w-full sm:w-auto">
      Ver cardápio
    </Botao>
  ) : null;

  // Full height only from sm up. On a phone a full-height hero with centred content
  // left blank bands above and below, and nothing said the page went on.
  return (
    <section
      id="hero"
      className="grao relative flex flex-col justify-center overflow-hidden px-6 pt-14 pb-16 sm:min-h-[100svh] sm:px-10 sm:py-24"
    >
      {temVideo && preenchido(site.videoHero) && (
        <>
          <FundoVideo src={asset(`/video/${site.videoHero.valor}`)} />
          {/* The type measures ~12:1 against musgo and nothing at all against raw
              footage, so the reel never reaches the page undiluted: it is always
              under the house's green, and the green is poured by where the type is,
              not evenly.

              Measured, not guessed. The type occupies 12%–90% of this gradient's run
              on a phone and 24%–76% on a desktop, and the tightest thing on it is the
              small "CANOAS · RS" in areia-suave, which owes 4,5:1 and had 4,75:1 to
              give. So the green stays solid through the foot — where the buttons are,
              and where the hero has to meet the section below without a seam — holds
              at 90% through the band the type reads in, and only lets go above it,
              where there is nothing but the record and the reel. */}
          <div
            data-cortina
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-musgo from-40% via-musgo/90 via-72% to-musgo/40"
          />
        </>
      )}

      {/* The record sits off the right edge on a phone and centres as the page widens. */}
      <Sulcos className="gira pointer-events-none absolute -right-1/3 top-1/2 h-[130vw] w-[130vw] -translate-y-1/2 text-areia opacity-[0.09] sm:-right-[10%] sm:h-[85vh] sm:w-[85vh] lg:right-[6%]" />

      <div className="relative z-10 mx-auto w-full max-w-md sm:max-w-2xl lg:max-w-4xl">
        <h1 className="mb-7">
          {temLogo && preenchido(site.logotipo) ? (
            <Image
              src={asset(`/${site.logotipo.valor}`)}
              alt={nome}
              width={1961}
              height={890}
              priority
              className="h-auto w-52 sm:w-72 lg:w-96"
            />
          ) : (
            <span className="block font-display text-6xl lowercase leading-none tracking-tight text-areia sm:text-8xl lg:text-9xl">
              vinil
            </span>
          )}
        </h1>

        <p className="font-display text-xs uppercase tracking-marquise text-areia-suave">
          {/* The official lockup already reads "(hi-fi bar)" under the name. */}
          {temLogo ? cidade : `hi-fi bar${cidade ? ` · ${cidade}` : ""}`}
        </p>

        {/* Wider from sm up than the old six-word tagline needed: the house's own
            line is sixty characters, and held at max-w-lg it broke into four short
            script lines with a ragged right edge — a column, where it is a phrase. */}
        {preenchido(site.tagline) && (
          <p className="mt-6 max-w-lg text-balance font-destaque text-3xl leading-[1.2] text-areia sm:max-w-xl sm:text-5xl lg:max-w-3xl lg:text-6xl">
            {site.tagline.valor}
          </p>
        )}

        {preenchido(site.whatsapp) ? (
          <FormReserva e164={site.whatsapp.valor.e164} aoLado={cardapio} className="mt-10" />
        ) : (
          cardapio && <div className="mt-10 flex flex-col sm:flex-row">{cardapio}</div>
        )}
      </div>
    </section>
  );
}
