import { site, preenchido } from "@/content/site";
import { FormReserva } from "./FormReserva";
import { Sulcos } from "./Sulcos";

/**
 * Step 1 of the ladder alternativas-de-mercado.md settled on: the CTA opens a short
 * form whose answers go to WhatsApp as a booking already written. It works from day
 * one, costs nothing, and does not fight the channel the house already uses.
 *
 * When UC02 ships, this points at /reservar instead — and the panel keeps absorbing
 * WhatsApp bookings through UC07, so the helpers stay either way.
 */
export function Reservar() {
  const w = preenchido(site.whatsapp) ? site.whatsapp.valor : null;

  return (
    <section
      id="reservar"
      aria-labelledby="reservar-titulo"
      className="grao relative overflow-hidden border-t border-areia/10 px-6 py-24 sm:px-10 sm:py-32"
    >
      <Sulcos className="pointer-events-none absolute left-1/2 top-1/2 h-[150vw] w-[150vw] -translate-x-1/2 -translate-y-1/2 text-areia opacity-[0.06] sm:h-[70vh] sm:w-[70vh]" />

      <div className="relative z-10 mx-auto w-full max-w-md text-center sm:max-w-2xl">
        <h2
          id="reservar-titulo"
          className="font-display text-3xl leading-tight text-areia sm:text-5xl"
        >
          Reservar mesa
        </h2>
        <p className="mx-auto mt-5 max-w-sm text-base leading-relaxed text-areia-suave">
          Escolha o dia, quantas pessoas e em nome de quem. A gente confirma pelo WhatsApp.
        </p>

        {w && <FormReserva e164={w.e164} alinhar="centro" className="mt-10" />}
      </div>
    </section>
  );
}
