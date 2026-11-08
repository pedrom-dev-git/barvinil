"use client";

import { useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { linkReserva } from "@/lib/whatsapp";
import { classeBotao } from "./Botao";

/** Local YYYY-MM-DD. Computed in the browser: the page is a static export, so a
 * value baked in at build time would go stale the day after the deploy. */
function hojeLocal(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** "2026-10-09" → "09/10/2026 · sexta-feira" — pt-BR whatever the browser's locale. */
function dataPorExtenso(iso: string): string {
  const [ano, mes, dia] = iso.split("-").map(Number);
  const semana = new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(
    new Date(ano, mes - 1, dia),
  );
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(dia)}/${p(mes)}/${ano} · ${semana}`;
}

/** The window the house takes a table in, given by the owner on 2026-10-25. It is
 * about booking, not about the door: site.horarioDetalhado is still `a-preencher`,
 * and nothing on the page says when the house opens. Moving the window is these two
 * lines — and a window that crossed midnight would need more than that. */
const ABRE = "19:30";
/** Breathing room under the send button once it has been brought on screen. */
const FOLGA = 24;
const FECHA = "22:30";

/**
 * How much of the bottom of the viewport is covered by chrome floating over it.
 *
 * Today that is the shortcuts dock, and today the answer is always 0 while a panel
 * is open — app/globals.css takes the dock off screen for exactly as long as one is.
 * This exists so that decision can be revisited without quietly burying the send
 * button: the scroll above brings `alvo.bottom + FOLGA` to the fold, and a fixed bar
 * is invisible to that arithmetic.
 *
 * Measured off the DOM instead of sharing a constant with the dock: a number copied
 * into two files is a number that goes stale in one of them. `visibility` is what
 * decides, which is also why the dock must be hidden with `invisible` and not merely
 * faded — tests/atalhos.spec.ts pins that invariant. Null means no dock, which is
 * what a desktop and a bare checkout both look like.
 */
function oclusaoInferior(): number {
  const cromo = document.querySelector<HTMLElement>("[data-atalhos]");
  if (!cromo || getComputedStyle(cromo).visibility === "hidden") return 0;
  return Math.max(0, window.innerHeight - cromo.getBoundingClientRect().top);
}

/** Every half hour from ABRE to FECHA, both ends included. */
const HORARIOS = (() => {
  const emMinutos = (h: string) => {
    const [hora, minuto] = h.split(":").map(Number);
    return hora * 60 + minuto;
  };
  const p = (n: number) => String(n).padStart(2, "0");
  const lista: string[] = [];
  for (let m = emMinutos(ABRE); m <= emMinutos(FECHA); m += 30) {
    lista.push(`${p(Math.floor(m / 60))}:${p(m % 60)}`);
  }
  return lista;
})();

// The border is a UI component, so it owes WCAG 1.4.11 its 3:1 — at areia/25 it was
// at 1,95:1 and the fields read as holes in the panel. tests/contraste.spec.ts.
const campo =
  "min-h-12 w-full rounded-lg border border-areia/50 bg-musgo px-4 text-base text-areia " +
  "placeholder:text-areia-suave focus:border-areia focus:outline-none";
const rotulo = "font-display text-[0.7rem] uppercase tracking-marquise text-areia-suave";

type Props = {
  e164: string;
  /** Other buttons that share the row with "Reservar mesa" (e.g. the menu). */
  aoLado?: ReactNode;
  alinhar?: "inicio" | "centro";
  className?: string;
};

/**
 * "Reservar mesa" opens this form — date, time, party size, name — and sending it opens
 * WhatsApp with the booking already written. Same pattern as the R. Amaral landing.
 * Nothing is stored: the house confirms by hand (step 1 of the ladder in
 * alternativas-de-mercado.md, until UC02 exists).
 */
export function FormReserva({ e164, aoLado, alinhar = "inicio", className = "" }: Props) {
  const id = useId();
  const [aberto, setAberto] = useState(false);
  const [hoje, setHoje] = useState<string>();
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const calendario = useRef<HTMLInputElement>(null);
  const botaoEnviar = useRef<HTMLButtonElement>(null);

  // Desktop nicety, never the only path: Chrome opens its calendar from the icon
  // alone, so a click anywhere on the field gets the guest the same picker. On a
  // phone the tap already landed on a real date input and the browser opened its
  // own — which is the whole point, because iOS never implemented showPicker() for
  // type=date and answers the call by doing nothing at all (WebKit 268114/261703).
  function abrirCalendario() {
    try {
      calendario.current?.showPicker();
    } catch {
      /* the browser opens its own picker on the click; nothing to recover from */
    }
  }

  function alternar() {
    setHoje(hojeLocal());
    const abrindo = !aberto;
    setAberto(abrindo);
    if (!abrindo) return;

    // What has to reach the screen is the END of the form. On a real phone the fold
    // is ~664px, not the 844px of a chromeless viewport, and the panel is taller
    // than that — bringing its top into view leaves the guest with a form they can
    // fill in and cannot send.
    //
    // 300ms into a 500ms opening: ease-suave is nearly done settling by then, so the
    // button is within a few pixels of where it lands, and the scroll starts while
    // the last of the growth is still happening — one motion rather than two. Fired
    // after everything had stopped, and instantly, it read as a second lurch.
    const suave = !matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(() => {
      const alvo = botaoEnviar.current?.getBoundingClientRect();
      if (!alvo) return;
      // The window, and nothing else. scrollIntoView also scrolls every scrollable
      // ancestor, and one of them is the panel's own overflow-hidden wrapper — mid
      // animation it still holds more than it shows, so it swallowed the scroll and
      // the page never moved.
      const faltando = Math.ceil(alvo.bottom + FOLGA + oclusaoInferior() - window.innerHeight);
      if (faltando > 0) window.scrollBy({ top: faltando, behavior: suave ? "smooth" : "auto" });
    }, suave ? 300 : 0);
  }

  function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.reportValidity()) return;

    const dados = new FormData(form);
    const url = linkReserva(e164, {
      data: String(dados.get("data")),
      hora: String(dados.get("hora")),
      pessoas: Number(dados.get("pessoas")),
      nome: String(dados.get("nome")),
    });
    // WebKit only opens a window it can tie to a user gesture, and iOS drops that
    // token easily; refused, window.open answers null. Ignoring that answer is how a
    // booking ends in nothing at all on an iPhone, so it goes in this tab instead —
    // which is a route WhatsApp knows how to take.
    const janela = window.open(url, "_blank", "noopener,noreferrer");
    if (!janela) window.location.href = url;
  }

  return (
    // Flex order puts the panel right under "Reservar mesa" on the phone, where the
    // buttons stack, and on a line of its own below the whole row on wider screens —
    // so opening it never shoves the neighbouring button sideways.
    <div
      className={`flex flex-col sm:flex-row sm:flex-wrap sm:gap-x-4 ${
        alinhar === "centro" ? "items-center sm:justify-center" : "sm:items-start"
      } ${className}`}
    >
      <button
        type="button"
        aria-expanded={aberto}
        aria-controls={`${id}-painel`}
        onClick={alternar}
        className={`${classeBotao("cheio")} order-1 w-full sm:w-auto`}
      >
        Reservar mesa
      </button>

      {/* On a phone the buttons stack, and pills of different widths under one
          another read as crooked — so there they share the column, and the fills
          against the outline are what carry the hierarchy. From sm up they sit side
          by side, where matching widths would make them look like equals. This holds
          however many share the row: the column on a phone, the line above sm. */}
      {aoLado && (
        <div
          className={`order-3 mt-3 flex w-full flex-col gap-3 sm:order-2 sm:mt-0 sm:w-auto sm:flex-row sm:gap-4 ${
            alinhar === "centro" ? "items-center" : "items-start"
          }`}
        >
          {aoLado}
        </div>
      )}

      {/* Opens by animating the grid row from 0fr to 1fr, so the panel eases to its
          natural height without anyone measuring it. Closed, it is `inert` and
          `invisible`: out of reach for keyboard and screen readers, not just shut. */}
      <div
        id={`${id}-painel`}
        data-painel-reserva
        inert={!aberto}
        className={`order-2 grid w-full text-left transition-[grid-template-rows,opacity,visibility] duration-500 ease-suave sm:order-3 sm:basis-full ${
          aberto ? "visible grid-rows-[1fr] opacity-100" : "invisible grid-rows-[0fr] opacity-0"
        }`}
      >
        <div
          className={`min-h-0 overflow-hidden transition-transform duration-500 ease-suave ${
            aberto ? "translate-y-0" : "-translate-y-2"
          }`}
        >
          <div className={`pt-4 ${alinhar === "centro" ? "flex justify-center" : ""}`}>
            <form
              onSubmit={enviar}
              className="flex w-full flex-col gap-5 rounded-2xl border border-areia/25 bg-musgo-claro p-6 sm:w-96"
            >
              <div className="flex flex-col gap-2">
                <label htmlFor={`${id}-data`} className={rotulo}>
                  Data
                </label>
                {/* The native date input IS the field: full size, transparent, on top.
                    A finger lands on a real date control and the browser opens its own
                    picker, with no API in between — the one thing an iPhone does not
                    give us is showPicker(). What the guest reads underneath is ours,
                    because a native date input is drawn in the browser's locale, and
                    that reads mm/dd/yyyy on a phone set to English. */}
                <div
                  className={`${campo} relative flex items-center focus-within:border-areia has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-[3px] has-[:focus-visible]:outline-areia`}
                >
                  <span
                    data-data-extenso
                    aria-hidden="true"
                    className={data ? "" : "text-areia-suave"}
                  >
                    {data ? dataPorExtenso(data) : "DD/MM/AAAA"}
                  </span>
                  <input
                    id={`${id}-data`}
                    ref={calendario}
                    name="data"
                    type="date"
                    required
                    min={hoje}
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    onClick={abrirCalendario}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label htmlFor={`${id}-hora`} className={rotulo}>
                      Hora
                    </label>
                    <select
                      id={`${id}-hora`}
                      name="hora"
                      required
                      aria-describedby={`${id}-janela`}
                      value={hora}
                      onChange={(e) => setHora(e.target.value)}
                      // The "--:--" hint is set in the softer tone, so an untouched
                      // select does not read as a time already chosen — softer, not
                      // faded: at half opacity it was 2,55:1 and stopped being text.
                      className={`${campo} cursor-pointer ${hora ? "" : "text-areia-suave"}`}
                    >
                      <option value="" disabled>
                        --:--
                      </option>
                      {HORARIOS.map((h) => (
                        <option key={h} value={h} className="text-areia">
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor={`${id}-pessoas`} className={rotulo}>
                      Pessoas
                    </label>
                    <input
                      id={`${id}-pessoas`}
                      name="pessoas"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      step={1}
                      required
                      className={campo}
                    />
                  </div>
                </div>

                {/* The list simply stops at 22:30 otherwise, and a guest who wanted
                    23:00 is left guessing whether the house is shut or the page is
                    broken. This is about taking a table, not about the door: when
                    the house opens is still the owner's to tell. */}
                <p id={`${id}-janela`} data-dica-hora className="text-xs text-areia-suave">
                  Reservas das {ABRE} às {FECHA}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor={`${id}-nome`} className={rotulo}>
                  Em nome de
                </label>
                <input
                  id={`${id}-nome`}
                  name="nome"
                  type="text"
                  autoComplete="name"
                  required
                  className={campo}
                />
              </div>

              <button type="submit" ref={botaoEnviar} className={`${classeBotao("cheio")} w-full`}>
                Enviar pelo WhatsApp
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
