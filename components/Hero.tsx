import Image from "next/image";
import { site, preenchido } from "@/content/site";
import { linkWhatsApp } from "@/lib/whatsapp";
import { Botao } from "./Botao";
import { Sulcos } from "./Sulcos";

/**
 * The mark IS the name, so the h1 is the wordmark image rather than the name set
 * in some other typeface. Its alt text carries the accessible name.
 */
export function Hero() {
  const nome = preenchido(site.nomeCompleto) ? site.nomeCompleto.valor : "Vinil";
  const cidade = preenchido(site.endereco)
    ? `${site.endereco.valor.cidade} · ${site.endereco.valor.uf}`
    : null;

  return (
    <section
      id="hero"
      className="grao relative flex min-h-[100svh] flex-col justify-center overflow-hidden px-6 py-24 sm:px-10"
    >
      {/* The record sits off the right edge on a phone and centres as the page widens. */}
      <Sulcos className="gira pointer-events-none absolute -right-1/3 top-1/2 h-[130vw] w-[130vw] -translate-y-1/2 text-creme opacity-[0.09] sm:-right-[10%] sm:h-[85vh] sm:w-[85vh] lg:right-[6%]" />

      <div className="relative z-10 mx-auto w-full max-w-md sm:max-w-2xl lg:max-w-4xl">
        <h1 className="mb-7">
          <Image
            src="/logo-vinil.png"
            alt={nome}
            width={948}
            height={336}
            priority
            className="h-auto w-52 sm:w-72 lg:w-96"
          />
        </h1>

        <p className="font-display text-[0.7rem] uppercase tracking-marquise text-creme-suave sm:text-xs">
          hi-fi bar{cidade ? ` · ${cidade}` : ""}
        </p>

        {preenchido(site.tagline) && (
          <p className="mt-6 max-w-lg font-display text-2xl leading-[1.25] text-creme sm:text-4xl lg:text-5xl">
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
