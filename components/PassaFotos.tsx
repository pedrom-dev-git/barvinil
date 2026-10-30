"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Sulcos } from "./Sulcos";

export type Quadro = {
  id: string;
  /** The photo's URL, already through asset() — null while the house still owes it. */
  src: string | null;
  alt: string;
};

/** 5 s a photo: long enough to look at, short enough to reach the last frame. */
const INTERVALO = 5000;

/**
 * How wide a frame is, by how many stand side by side at the widest viewport.
 *
 * Three abreast is the ceiling, not the rule: the house still owes four of the six
 * photos, and a row holding three columns with one of them empty reads as broken
 * rather than as pending. So the frames widen to fill the row they have.
 *
 * Spelled out rather than assembled: Tailwind reads this file as text, and a class
 * built at runtime is a class that was never generated. The gap is gap-4 below, so
 * two columns give up 1rem of the row and three give up 2rem.
 */
const LARGURA = [
  "w-full",
  "w-full",
  "w-full sm:w-[calc((100%-1rem)/2)]",
  "w-full sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)]",
] as const;

/**
 * Where the rail rests with frame `i` at its left edge.
 *
 * Clamped, because the last frames share the last resting place: three abreast out
 * of four photos, the rail runs out of travel one frame in, and asking for the
 * fourth has to mean the same scroll position as asking for the second.
 */
function alvo(el: HTMLElement, i: number): number {
  const filho = el.children[i] as HTMLElement | undefined;
  if (!filho) return 0;
  return Math.min(filho.offsetLeft, el.scrollWidth - el.clientWidth);
}

/** Which frame the rail is showing: the one whose resting place it sits nearest. */
function indice(el: HTMLElement): number {
  let melhor = 0;
  for (let i = 1; i < el.children.length; i++) {
    // Strict, so where several frames clamp to the same place the first one wins —
    // which is the one the guest sees on the left.
    if (Math.abs(alvo(el, i) - el.scrollLeft) < Math.abs(alvo(el, melhor) - el.scrollLeft)) {
      melhor = i;
    }
  }
  return melhor;
}

/**
 * How many places the rail actually stops at — which is what a dot stands for.
 *
 * Not the number of photos: three abreast out of four, there are two stops, and a
 * dot for a photo that is never reached on its own would be a control that lies.
 * Zero when nothing is out of view, and then there is nothing to pass at all.
 */
function paradas(el: HTMLElement): number {
  const fim = el.scrollWidth - el.clientWidth;
  if (fim <= 1) return 0;
  for (let i = 0; i < el.children.length; i++) {
    if ((el.children[i] as HTMLElement).offsetLeft >= fim - 1) return i + 1;
  }
  return el.children.length;
}

/**
 * The gallery as the owner asked for it: the photos pass by themselves
 * (insumos-apresentacao.md §3).
 *
 * The rail's scroll position is the only state that counts. The lit dot is read off
 * it, and both the clock and the dots act by scrolling — nothing writes an index
 * back onto the rail, so a hand-swipe and the clock never fight over where it sits.
 */
export function PassaFotos({ quadros }: { quadros: ReadonlyArray<Quadro> }) {
  const trilho = useRef<HTMLUListElement>(null);
  const [aceso, setAceso] = useState(0);
  const [parado, setParado] = useState(false);
  const [encerrado, setEncerrado] = useState(false);
  const [menosMovimento, setMenosMovimento] = useState(false);
  /** Stops, measured. 0 until the browser has laid the rail out — see below. */
  const [pontos, setPontos] = useState(0);
  /** The frame this component itself put the rail on, last time it moved it. */
  const nosso = useRef(0);

  useEffect(() => {
    const consulta = matchMedia("(prefers-reduced-motion: reduce)");
    const ler = () => setMenosMovimento(consulta.matches);
    ler();
    consulta.addEventListener("change", ler);
    return () => consulta.removeEventListener("change", ler);
  }, []);

  // How many stops there are is a question only the laid-out page can answer: it
  // depends on how many frames fit the row, which is the viewport's business. So it
  // is measured, and measured again when the rail is resized across a breakpoint.
  useEffect(() => {
    const el = trilho.current;
    if (!el) return;
    const medir = () => setPontos(paradas(el));
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    return () => observador.disconnect();
  }, [quadros.length]);

  // Movement is opt-in, same stance as .gira in globals.css: for anyone who asked
  // for less motion there is no timer at all, not a timer that gets overridden.
  useEffect(() => {
    if (menosMovimento || parado || encerrado || pontos < 2) return;
    const relogio = setInterval(() => {
      const el = trilho.current;
      if (!el) return;
      rolar(el, (indice(el) + 1) % pontos, "smooth");
    }, INTERVALO);
    return () => clearInterval(relogio);
  }, [menosMovimento, parado, encerrado, pontos]);

  /** Scrolls the rail, claiming the frame so arriving there does not read as a swipe. */
  function rolar(el: HTMLElement, i: number, comportamento: ScrollBehavior) {
    nosso.current = i;
    el.scrollTo({ left: alvo(el, i), behavior: comportamento });
  }

  function irPara(i: number) {
    const el = trilho.current;
    if (!el) return;
    // Having chosen a photo, the guest is not carried off it five seconds later.
    setEncerrado(true);
    rolar(el, i, menosMovimento ? "auto" : "smooth");
  }

  function aoRolar(el: HTMLElement) {
    const i = indice(el);
    setAceso(i);

    // A scroll arrives as a stream of events, so what counts is where the rail comes
    // to rest, not where it passes. Resting anywhere this component did not ask for
    // is a hand on the rail — and from there it is the guest's, not the clock's.
    const assentado = Math.abs(el.scrollLeft - alvo(el, i)) <= 1.5;
    if (assentado && i !== nosso.current) setEncerrado(true);
  }

  return (
    // Capped on a phone, where one portrait frame is the whole of it; from sm up the
    // rail takes the full width of this section's container, which is already
    // centred. A 4:5 frame only got too tall for a desktop while it was alone in the
    // row — three abreast of a 896px section are ~288px wide and ~360px tall.
    <div
      className="mt-8 w-full max-w-sm sm:max-w-none"
      // A mouse resting on the gallery is someone reading it, and it leaves again.
      // A finger is not that: a phone fires a synthetic pointerenter and never the
      // matching leave, so pausing on touch here would stop the clock for good on
      // the first finger that grazes the rail. Touch says what it wants by moving
      // the rail or pressing a dot, and both are handled where they happen.
      onPointerEnter={(e) => e.pointerType === "mouse" && setParado(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setParado(false)}
    >
      {/* tabIndex + aria-label: a horizontally scrollable region has to be reachable
          by keyboard, or there is no way past the first frame without a mouse. axe
          flags this as scrollable-region-focusable, and it is right.

          relative is load-bearing, not decoration: it makes this the offsetParent of
          the frames, so a frame's offsetLeft is the scroll position that brings it
          to the left edge — which is the whole of the arithmetic above. */}
      <ul
        ref={trilho}
        tabIndex={0}
        aria-label="Fotos da casa"
        data-passa-fotos
        onScroll={(e) => aoRolar(e.currentTarget)}
        // Keyboard focus is reading; the focus a tap leaves behind is not, and it
        // never blurs. :focus-visible is exactly that distinction.
        onFocus={(e) => setParado(e.currentTarget.matches(":focus-visible"))}
        onBlur={() => setParado(false)}
        className="relative flex w-full snap-x snap-mandatory gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {quadros.map((q) => (
          <li
            key={q.id}
            className={`relative aspect-4/5 shrink-0 snap-start overflow-hidden rounded-lg border border-areia/25 bg-musgo-claro ${
              LARGURA[Math.min(3, quadros.length)]
            }`}
          >
            {q.src ? (
              <Image
                src={q.src}
                alt={q.alt}
                fill
                sizes="(min-width: 1024px) 288px, (min-width: 640px) 328px, 100vw"
                className="object-cover"
              />
            ) : (
              <Sulcos className="absolute left-1/2 top-1/2 h-[78%] w-[78%] -translate-x-1/2 -translate-y-1/2 text-areia opacity-[0.22]" />
            )}
          </li>
        ))}
      </ul>

      {pontos > 1 && (
        // mt-2, not mt-4: the targets below are 44px tall and mostly empty, so the
        // ink sits where mt-4 on a tight row would have put it.
        <div className="mt-2 flex items-center justify-center">
          {Array.from({ length: pontos }, (_, i) => (
            // 1.5 units of ink in a 44px-tall target — small on the page, still a
            // thumb-sized button (landing.spec.ts asserts the 44px on the phone).
            <button
              key={quadros[i]?.id ?? i}
              type="button"
              data-ponto={i}
              aria-current={i === aceso}
              aria-label={`Foto ${i + 1} de ${quadros.length}`}
              onClick={() => irPara(i)}
              className="grid h-11 w-7 place-items-center"
            >
              {/* At areia/30 the dim dot was 2,40:1 and said nothing about there
                  being more photos. It is a control: 3:1, like any other. */}
              <span
                className={`h-2 w-2 rounded-full transition-colors ${
                  i === aceso ? "bg-areia" : "bg-areia/55"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
