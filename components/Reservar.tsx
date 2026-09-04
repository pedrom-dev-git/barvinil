import { site, preenchido } from "@/content/site";
import { linkWhatsApp } from "@/lib/whatsapp";
import { Botao } from "./Botao";
import { Sulcos } from "./Sulcos";

/**
 * Step 1 of the ladder alternativas-de-mercado.md settled on: the CTA opens WhatsApp
 * with the message already written. It works from day one, costs nothing, and does
 * not fight the channel the house already uses.
 *
 * When UC02 ships, this button points at /reservar instead — and the panel keeps
 * absorbing WhatsApp bookings through UC07, so the helper stays either way.
 */
export function Reservar() {
  const w = preenchido(site.whatsapp) ? site.whatsapp.valor : null;

  return (
    <section
      id="reservar"
      aria-labelledby="reservar-titulo"
      className="grao relative overflow-hidden border-t border-creme/10 px-6 py-24 sm:px-10 sm:py-32"
    >
      <Sulcos className="pointer-events-none absolute left-1/2 top-1/2 h-[150vw] w-[150vw] -translate-x-1/2 -translate-y-1/2 text-creme opacity-[0.06] sm:h-[70vh] sm:w-[70vh]" />

      <div className="relative z-10 mx-auto w-full max-w-md text-center sm:max-w-2xl">
        <h2
          id="reservar-titulo"
          className="font-display text-3xl leading-tight text-creme sm:text-5xl"
        >
          Reservar mesa
        </h2>
        <p className="mx-auto mt-5 max-w-sm text-base leading-relaxed text-creme-suave">
          Diga o dia, o horário e quantas pessoas. A gente confirma pelo WhatsApp.
        </p>

        {w && (
          <div className="mt-10 flex justify-center">
            <Botao
              href={linkWhatsApp(w.e164, "reserva")}
              variante="cheio"
              externo
            >
              Reservar mesa
            </Botao>
          </div>
        )}
      </div>
    </section>
  );
}
