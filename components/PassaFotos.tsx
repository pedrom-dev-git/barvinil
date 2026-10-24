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

/** Which frame the rail is showing. Exact because a frame is one view wide, no gap. */
function indice(el: HTMLElement): number {
  return el.clientWidth ? Math.round(el.scrollLeft / el.clientWidth) : 0;
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
  const [menosMovimento, setMenosMovimento] = useState(false);

  useEffect(() => {
    const consulta = matchMedia("(prefers-reduced-motion: reduce)");
    const ler = () => setMenosMovimento(consulta.matches);
    ler();
    consulta.addEventListener("change", ler);
    return () => consulta.removeEventListener("change", ler);
  }, []);

  // Movement is opt-in, same stance as .gira in globals.css: for anyone who asked
  // for less motion there is no timer at all, not a timer that gets overridden.
  useEffect(() => {
    if (menosMovimento || parado || quadros.length < 2) return;
    const relogio = setInterval(() => {
      const el = trilho.current;
      if (!el) return;
      const proximo = (indice(el) + 1) % quadros.length;
      el.scrollTo({ left: proximo * el.clientWidth, behavior: "smooth" });
    }, INTERVALO);
    return () => clearInterval(relogio);
  }, [menosMovimento, parado, quadros.length]);

  function irPara(i: number) {
    const el = trilho.current;
    el?.scrollTo({ left: i * el.clientWidth, behavior: menosMovimento ? "auto" : "smooth" });
  }

  return (
    // Capped width, left-aligned with the section title: a 4:5 frame at the full
    // width of this section's container would be over 1100px tall on a desktop.
    <div
      className="mt-8 w-full max-w-sm"
      // The pointer resting on the gallery means someone is looking at it. The
      // keyboard case is narrower and sits on the rail itself: a dot is a control,
      // pressing it is not reading, so it moves the rail without stopping the clock.
      onMouseEnter={() => setParado(true)}
      onMouseLeave={() => setParado(false)}
    >
      {/* tabIndex + aria-label: a horizontally scrollable region has to be reachable
          by keyboard, or there is no way past the first frame without a mouse. axe
          flags this as scrollable-region-focusable, and it is right. */}
      <ul
        ref={trilho}
        tabIndex={0}
        aria-label="Fotos da casa"
        data-passa-fotos
        onScroll={(e) => setAceso(indice(e.currentTarget))}
        onFocus={() => setParado(true)}
        onBlur={() => setParado(false)}
        className="flex w-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {quadros.map((q) => (
          <li
            key={q.id}
            className="relative aspect-4/5 w-full shrink-0 snap-start overflow-hidden rounded-lg border border-areia/10 bg-musgo-claro"
          >
            {q.src ? (
              <Image
                src={q.src}
                alt={q.alt}
                fill
                sizes="(min-width: 640px) 384px, 100vw"
                className="object-cover"
              />
            ) : (
              <Sulcos className="absolute left-1/2 top-1/2 h-[78%] w-[78%] -translate-x-1/2 -translate-y-1/2 text-areia opacity-[0.22]" />
            )}
          </li>
        ))}
      </ul>

      {quadros.length > 1 && (
        // mt-2, not mt-4: the targets below are 44px tall and mostly empty, so the
        // ink sits where mt-4 on a tight row would have put it.
        <div className="mt-2 flex items-center">
          {quadros.map((q, i) => (
            // 1.5 units of ink in a 44px-tall target — small on the page, still a
            // thumb-sized button (landing.spec.ts asserts the 44px on the phone).
            <button
              key={q.id}
              type="button"
              data-ponto={i}
              aria-current={i === aceso}
              aria-label={`Foto ${i + 1} de ${quadros.length}`}
              onClick={() => irPara(i)}
              className="grid h-11 w-7 place-items-center"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  i === aceso ? "bg-areia" : "bg-areia/30"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
