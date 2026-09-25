"use client";

import { useId, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
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

/** Every half hour, 24h. The house's opening hours are not confirmed yet
 * (site.horarioDetalhado is `a-preencher`); once they are, the slots come from it. */
const HORARIOS = Array.from({ length: 48 }, (_, i) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(Math.floor(i / 2))}:${i % 2 ? "30" : "00"}`;
});

const campo =
  "min-h-12 w-full rounded-lg border border-areia/25 bg-musgo px-4 text-base text-areia " +
  "placeholder:text-areia-suave/50 focus:border-areia focus:outline-none";
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
  // Browsers without showPicker() get the plain native field instead.
  const [dataNativa, setDataNativa] = useState(false);
  const calendario = useRef<HTMLInputElement>(null);

  // A native <input type="date"> is drawn in the browser's locale — mm/dd/yyyy on
  // an English system. So the calendar stays native, but the field the guest sees
  // is ours and always reads in pt-BR.
  function abrirCalendario() {
    try {
      calendario.current?.showPicker();
    } catch {
      setDataNativa(true);
    }
  }

  function teclaNaData(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Tab") return;
    e.preventDefault();
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") abrirCalendario();
  }

  function alternar() {
    setHoje(hojeLocal());
    setAberto((a) => !a);
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
    window.open(url, "_blank", "noopener,noreferrer");
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

      {aoLado && <div className="order-3 mt-3 flex flex-col sm:order-2 sm:mt-0">{aoLado}</div>}

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
              className="flex w-full flex-col gap-5 rounded-2xl border border-areia/10 bg-musgo-claro p-6 sm:w-96"
            >
              <div className="relative flex flex-col gap-2">
                <label htmlFor={`${id}-data`} className={rotulo}>
                  Data
                </label>
                {dataNativa ? (
                  <input
                    id={`${id}-data`}
                    name="data"
                    type="date"
                    required
                    min={hoje}
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    className={campo}
                  />
                ) : (
                  <>
                    <input
                      id={`${id}-data`}
                      type="text"
                      inputMode="none"
                      autoComplete="off"
                      required
                      placeholder="DD/MM/AAAA"
                      value={data ? dataPorExtenso(data) : ""}
                      onChange={() => {}}
                      onClick={abrirCalendario}
                      onKeyDown={teclaNaData}
                      className={`${campo} cursor-pointer caret-transparent`}
                    />
                    {/* The real value, and the calendar's anchor. Out of the tab order
                        and the accessibility tree: the field above speaks for it. */}
                    <input
                      ref={calendario}
                      name="data"
                      type="date"
                      min={hoje}
                      value={data}
                      onChange={(e) => setData(e.target.value)}
                      tabIndex={-1}
                      aria-hidden="true"
                      className="pointer-events-none absolute bottom-0 left-4 h-px w-px opacity-0"
                    />
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor={`${id}-hora`} className={rotulo}>
                    Hora
                  </label>
                  <select
                    id={`${id}-hora`}
                    name="hora"
                    required
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    // The "--:--" hint is faded like a placeholder, so an untouched
                    // select does not read as a time already chosen.
                    className={`${campo} cursor-pointer ${hora ? "" : "text-areia-suave/50"}`}
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

              <button type="submit" className={`${classeBotao("cheio")} w-full`}>
                Enviar pelo WhatsApp
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
