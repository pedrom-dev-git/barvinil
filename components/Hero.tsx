import { existsSync } from "node:fs";
import { join } from "node:path";
import Image from "next/image";
import { site, preenchido } from "@/content/site";
import { linkWhatsApp } from "@/lib/whatsapp";
import { asset } from "@/lib/asset";
import { Botao } from "./Botao";
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
  const cidade = preenchido(site.endereco)
    ? `${site.endereco.valor.cidade} · ${site.endereco.valor.uf}`
    : null;

  return (
    <section
      id="hero"
      className="grao relative flex min-h-[100svh] flex-col justify-center overflow-hidden px-6 py-24 sm:px-10"
    >
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

        <p className="font-display text-[0.7rem] uppercase tracking-marquise text-areia-suave sm:text-xs">
          {/* The official lockup already reads "(hi-fi bar)" under the name. */}
          {temLogo ? cidade : `hi-fi bar${cidade ? ` · ${cidade}` : ""}`}
        </p>

        {preenchido(site.tagline) && (
          <p className="mt-6 max-w-lg font-destaque text-3xl leading-[1.2] text-areia sm:text-5xl lg:text-6xl">
            {site.tagline.valor}
          </p>
        )}

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
          {preenchido(site.whatsapp) && (
            <Botao
              href={linkWhatsApp(site.whatsapp.valor.e164, "reserva")}
              variante="cheio"
              externo
            >
              Reservar mesa
            </Botao>
          )}
          {preenchido(site.cardapio) && (
            <Botao href={site.cardapio.valor} externo>
              Ver cardápio
            </Botao>
          )}
        </div>
      </div>
    </section>
  );
}
