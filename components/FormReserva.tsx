"use client";

import { useId, useState, type FormEvent, type MouseEvent, type ReactNode } from "react";
import { linkReserva } from "@/lib/whatsapp";
import { classeBotao } from "./Botao";

/** Local YYYY-MM-DD. Computed in the browser: the page is a static export, so a
 * value baked in at build time would go stale the day after the deploy. */
function hojeLocal(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** The whole field opens the calendar, not just the small icon at its edge. */
function abrirCalendario(e: MouseEvent<HTMLInputElement>) {
  try {
    e.currentTarget.showPicker();
  } catch {
    // Older browsers: the native control still works on its own.
  }
}

const campo =
  "min-h-12 w-full rounded-lg border border-areia/25 bg-musgo px-4 text-base text-areia " +
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
 * "Reservar mesa" opens this form — date, party size, name — and sending it opens
 * WhatsApp with the booking already written. Same pattern as the R. Amaral landing.
 * Nothing is stored: the house confirms by hand (step 1 of the ladder in
 * alternativas-de-mercado.md, until UC02 exists).
 */
export function FormReserva({ e164, aoLado, alinhar = "inicio", className = "" }: Props) {
  const id = useId();
  const [aberto, setAberto] = useState(false);
  const [hoje, setHoje] = useState<string>();

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
      className={`flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4 ${
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

      {aoLado && <div className="order-3 flex flex-col sm:order-2">{aoLado}</div>}

      <div
        id={`${id}-painel`}
        hidden={!aberto}
        className={`order-2 w-full text-left sm:order-3 sm:basis-full ${
          alinhar === "centro" ? "flex justify-center" : ""
        }`}
      >
        <form
          onSubmit={enviar}
          className="flex w-full flex-col gap-5 rounded-2xl border border-areia/10 bg-musgo-claro p-6 sm:w-96"
        >
          <div className="flex flex-col gap-2">
            <label htmlFor={`${id}-data`} className={rotulo}>
              Data
            </label>
            <input
              id={`${id}-data`}
              name="data"
              type="date"
              required
              min={hoje}
              onClick={abrirCalendario}
              className={`${campo} cursor-pointer`}
            />
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
              placeholder="2"
              className={campo}
            />
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
              placeholder="Seu nome"
              className={campo}
            />
          </div>

          <button type="submit" className={`${classeBotao("cheio")} w-full`}>
            Enviar pelo WhatsApp
          </button>
        </form>
      </div>
    </div>
  );
}
