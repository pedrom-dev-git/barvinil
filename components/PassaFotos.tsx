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
 * How long the rail has to be still before it counts as having come to rest.
 *
 * A scroll arrives as a stream of events and says nothing about where it is going, so
 * resting is quiet rather than an event. `scrollend` would say it outright, but both
 * Playwright projects are Chromium and a fallback branch for other engines would never
 * be exercised by the suite — a branch no test can reach is a branch that is wrong.
 * One path, measured on both viewports.
 *
 * The error is asymmetric, which is why 120 and not 60: too short and a stalled frame
 * in the middle of a fling reads as rest, which is wrong; too long and the trip home
 * is late, which costs nothing, because the clock gives it five seconds and the frame
 * it waits on is pixel for pixel the one it is going to.
 */
const ASSENTA = 120;

/**
 * How long a hand holds the rail before the clock takes it back.
 *
 * Three beats, written as three beats: long enough to finish looking at the photograph
 * you stopped on, short enough that the gallery is never dead. It used to be forever,
 * which respected the choice and answered "ele vai pro lado e para" with yes.
 *
 * The cost is real and was accepted rather than hidden: press the third dot, and
 * fifteen seconds later you are somewhere else. A gallery that stops for good on the
 * first touch is the worse of the two.
 */
const RETOMA = 3 * INTERVALO;

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
 * The clamp used to be the mechanism — three abreast out of four photos, the rail ran
 * out of travel one frame in, and the last frames all shared the last resting place.
 * With a lap of clones behind the photographs no real frame reaches it any more, so it
 * is a net rather than arithmetic: it stays because a future lap shorter than the row
 * would put it back to work, and because scrollTo past the end is a silent lie
 * otherwise.
 */
function alvo(el: HTMLElement, i: number): number {
  const filho = el.children[i] as HTMLElement | undefined;
  if (!filho) return 0;
  return Math.min(filho.offsetLeft, el.scrollWidth - el.clientWidth);
}

/**
 * Which frame the rail is showing: the one whose resting place it sits nearest.
 *
 * Counts clones too, so this returns 0 … fotos+volta-1. Every caller that means a
 * PHOTOGRAPH takes it modulo the number of photographs — the clone of frame 0 is
 * frame 0 as far as the guest is concerned, which is the whole point of it.
 */
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
 * How many frames stand side by side in the row.
 *
 * This replaces a function that counted the rail's resting places, and the swap is the
 * whole shape of the change. Stops used to be fewer than photographs — three abreast
 * out of five, the rail ran out of travel and the last three shared one resting place,
 * so a dot per photo would have been a control that lies. The lap of clones gives the
 * rail enough travel for every photograph to reach the left edge, and then the count
 * that matters is how many fit the row: it decides how long the lap has to be, and
 * whether there is anything to pass at all.
 *
 * The step is the distance between two frames' left edges rather than width plus gap —
 * one measurement instead of two, and no fractional pixel to drift at a breakpoint.
 * Measured off real frames, because frames 0 and 1 are always photographs.
 */
function colunas(el: HTMLElement): number {
  const filhos = Array.from(el.children) as HTMLElement[];
  if (filhos.length < 2) return filhos.length;
  const passo = filhos[1].offsetLeft - filhos[0].offsetLeft;
  if (passo <= 0) return filhos.length;
  const vao = parseFloat(getComputedStyle(el).columnGap) || 0;
  return Math.round((el.clientWidth + vao) / passo);
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
  /**
   * A hand has the rail. Separate from `parado`, and the two are not the same shape.
   *
   * A mouse leaving is an event, so `parado` can wait for it. A finger has no matching
   * leave — that is the whole reason this component never paused on touch — so what
   * ends this one is time. Folded into a single flag, one of them would be wrong: a
   * mouse resting on the gallery would have the clock start under it after fifteen
   * seconds, or a pointerleave would cancel a timer that a finger is still waiting on.
   * Two reasons, held apart, OR'd where the clock reads them.
   */
  const [pausado, setPausado] = useState(false);
  const [menosMovimento, setMenosMovimento] = useState(false);
  /**
   * Frames per row, measured. 0 until the browser has laid the rail out — see below.
   *
   * Everything about the loop falls out of this one number: how long the lap is, how
   * many dots there are, and whether there is anything to pass.
   */
  const [cabem, setCabem] = useState(0);
  /** The frame this component itself put the rail on, last time it moved it. */
  const nosso = useRef(0);
  /** Pending "the rail has gone quiet" check. */
  const assento = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Pending "the hand has had long enough" timer. */
  const retomada = useRef<ReturnType<typeof setTimeout> | null>(null);
  /**
   * A finger is on the rail right now.
   *
   * People stop mid-drag to look at a photograph, and a pause longer than ASSENTA with
   * the finger still down would otherwise be read as rest. Coming home under a
   * stationary finger pulls the content out from under it and the browser carries on
   * dragging from the new offset — the rail jumps a whole lap. So the trip waits for
   * the hand to leave, and the release asks again.
   */
  const emMao = useRef(false);

  const fotos = quadros.length;
  /** Nothing to pass when every photograph is already in the row. */
  const passa = cabem > 0 && cabem < fotos;
  /**
   * The lap: as many copies of the leading frames as fit the row.
   *
   * Exactly `cabem`, not one less. One less is enough for every photograph to reach
   * the left edge, but not for the arrival to be invisible — resting on the first
   * clone, the window shows that clone and the ones after it, and all of them have to
   * exist. At exactly `cabem` the rail's travel equals one lap, which makes the trip
   * home an exact subtraction instead of a number that nearly fits.
   *
   * Appended, never prepended. The first photograph has to rest at scrollLeft 0 — it
   * is where the rail starts, where pressing the first dot returns to, and what the
   * page shows to someone who asked for less motion.
   */
  const volta = passa ? Math.min(cabem, fotos) : 0;
  /** One dot per photograph, now that the loop makes every one of them reachable. */
  const pontos = passa ? fotos : 0;

  useEffect(() => {
    const consulta = matchMedia("(prefers-reduced-motion: reduce)");
    const ler = () => setMenosMovimento(consulta.matches);
    ler();
    consulta.addEventListener("change", ler);
    return () => consulta.removeEventListener("change", ler);
  }, []);

  // How many frames fit the row is a question only the laid-out page can answer, and
  // the answer is the viewport's business. So it is measured, and measured again when
  // the rail is resized across a breakpoint.
  //
  // This is also why the lap is born on the client and never in the HTML: the server
  // cannot know how wide the row is, and a lap rendered there would hand someone with
  // no JavaScript a strip of repeated photographs with nothing to explain them. The
  // first client render matches the server exactly — cabem is 0, so there are no
  // clones — and the lap arrives with the measurement, one render later.
  useEffect(() => {
    const el = trilho.current;
    if (!el) return;
    const medir = () => {
      setCabem(colunas(el));
      // Crossing a breakpoint re-lays the row and the browser re-snaps the rail, which
      // arrives as a scroll this component did not ask for — indistinguishable, from
      // the outside, from a hand. Claiming the rail's current frame makes the
      // difference legible again.
      nosso.current = indice(el);
    };
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    return () => {
      observador.disconnect();
      if (assento.current) clearTimeout(assento.current);
      if (retomada.current) clearTimeout(retomada.current);
    };
  }, [quadros.length]);

  // Movement is opt-in, same stance as .gira in globals.css: for anyone who asked
  // for less motion there is no timer at all, not a timer that gets overridden.
  useEffect(() => {
    if (menosMovimento || parado || pausado || pontos < 2) return;
    const relogio = setInterval(() => {
      const el = trilho.current;
      if (!el) return;
      // Forward, always — never modulo the stops. The modulo is what made the rail
      // rewind at the end of the row, sweeping every photograph in reverse, and it is
      // the whole of the complaint this answers. Past the last photograph the next
      // frame is the first clone, and the trip home happens once the rail is quiet.
      //
      // Clamped at the last child rather than left to run off the end: alvo() returns
      // 0 for a frame that does not exist, which would be a rewind to the beginning
      // coming in through the back door, and no test would name it.
      rolar(el, Math.min(indice(el) + 1, el.children.length - 1), "smooth");
    }, INTERVALO);
    return () => clearInterval(relogio);
    // `pausado` being a dependency is how the guest gets a whole beat back: coming off
    // the pause rebuilds the interval, so the photograph they are on gets its five
    // seconds rather than whatever was left of a tick that kept running underneath.
  }, [menosMovimento, parado, pausado, pontos]);

  /**
   * The rail is the guest's for a while.
   *
   * Re-armed rather than queued, so three touches in a row mean fifteen seconds from
   * the last one and not forty-five from the first.
   */
  function pausar() {
    setPausado(true);
    if (retomada.current) clearTimeout(retomada.current);
    retomada.current = setTimeout(() => setPausado(false), RETOMA);
  }

  /** Scrolls the rail, claiming the frame so arriving there does not read as a swipe. */
  function rolar(el: HTMLElement, i: number, comportamento: ScrollBehavior) {
    nosso.current = i;
    el.scrollTo({ left: alvo(el, i), behavior: comportamento });
  }

  function irPara(i: number) {
    const el = trilho.current;
    if (!el) return;
    // Having chosen a photo, the guest is not carried off it five seconds later —
    // fifteen, and only because a gallery that never moves again is worse than one
    // that eventually moves on.
    pausar();
    rolar(el, i, menosMovimento ? "auto" : "smooth");
  }

  function aoRolar(el: HTMLElement) {
    // Modulo the photographs: sitting on the clone of frame 0, the guest is looking at
    // frame 0, and the dot has to say so. It is also what makes the trip home
    // invisible — the lit dot does not change when the rail jumps back.
    //
    // Written live, with no delay: the dot follows the rail under the finger, and only
    // the decisions below wait for it to be still.
    setAceso(fotos > 0 ? indice(el) % fotos : 0);

    if (assento.current) clearTimeout(assento.current);
    assento.current = setTimeout(() => assentou(el), ASSENTA);
  }

  /**
   * The rail has gone quiet. Two decisions, and the order between them is load-bearing.
   *
   * Reading a scroll WHILE it happens is what used to kill this gallery: the rail
   * passes within a pixel of every stop on its way somewhere, and the old handler
   * asked "am I at a stop I did not ask for?" on each event. Rewinding across four
   * stops it was a matter of sampling luck, and the clock died for good — on a phone
   * sampling finely enough to hit one of those windows, every time.
   */
  function assentou(el: HTMLElement) {
    const i = indice(el);

    // Whose hand moved it — asked first, and asked of the frame the rail actually came
    // to rest on. If the trip home ran first, the rail would already be sitting on the
    // frame this component asked for, and a guest who dragged to the end of the lap
    // would have the slideshow start up again under their finger.
    const noLugar = Math.abs(el.scrollLeft - alvo(el, i)) <= 1.5;
    if (noLugar && i !== nosso.current) pausar();

    // And then home. By index, never by subtracting a lap's worth of pixels: offsetLeft
    // is a whole number and already a snap position, while scrollLeft minus a lap can
    // land half a pixel off one, and a mandatory snap container answers that with an
    // animation of its own — which is jitter, and more events, and a second trip.
    //
    // behavior "auto" is instant, so this is one event, and the frame it lands on is
    // the same picture at the same scale: nothing moves on screen. The event it does
    // fire re-arms the check above, which then finds the rail where this put it and
    // does nothing. One extra round, and it terminates.
    if (!emMao.current && fotos > 0 && i >= fotos) rolar(el, i - fotos, "auto");
  }

  /**
   * One frame of the rail — a photograph, or a copy of one.
   *
   * The width class is indexed by how many PHOTOGRAPHS there are, never by how many
   * children the rail ends up with: the lap must not make the frames narrower, and
   * LARGURA is a table of written-out strings precisely because a class assembled at
   * runtime is a class Tailwind never generated.
   */
  function moldura(q: Quadro, chave: string, clone: boolean) {
    return (
      <li
        key={chave}
        {...(clone ? { "data-clone": true, "aria-hidden": true } : {})}
        className={`relative aspect-4/5 shrink-0 snap-start overflow-hidden rounded-lg border border-areia/25 bg-musgo-claro ${
          LARGURA[Math.min(3, fotos)]
        }`}
      >
        {q.src ? (
          <Image
            src={q.src}
            alt={clone ? "" : q.alt}
            fill
            sizes="(min-width: 1024px) 288px, (min-width: 640px) 328px, 100vw"
            className="object-cover"
          />
        ) : (
          <Sulcos className="absolute left-1/2 top-1/2 h-[78%] w-[78%] -translate-x-1/2 -translate-y-1/2 text-areia opacity-[0.22]" />
        )}
      </li>
    );
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
        // A finger down means the rail may stop moving without having come to rest,
        // and the trip home must not run under it. The release asks again, because by
        // then the rail has usually been quiet for longer than ASSENTA and no further
        // scroll event is coming to re-arm the check.
        onPointerDown={() => {
          emMao.current = true;
        }}
        // A wheel and the arrow keys move the rail without a pointer ever going down,
        // and both say the same thing a finger does. The settled check below would
        // reach the same conclusion 120ms later; saying it here means the clock does
        // not get one more tick in while the guest is still arriving.
        onWheel={pausar}
        onKeyDown={(e) => {
          if (e.key.startsWith("Arrow") || ["Home", "End", "PageUp", "PageDown"].includes(e.key)) {
            pausar();
          }
        }}
        onPointerUp={(e) => {
          emMao.current = false;
          assentou(e.currentTarget);
        }}
        onPointerCancel={(e) => {
          emMao.current = false;
          assentou(e.currentTarget);
        }}
        // Keyboard focus is reading; the focus a tap leaves behind is not, and it
        // never blurs. :focus-visible is exactly that distinction.
        onFocus={(e) => setParado(e.currentTarget.matches(":focus-visible"))}
        onBlur={() => setParado(false)}
        className="relative flex w-full snap-x snap-mandatory gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {quadros.map((q) => moldura(q, q.id, false))}
        {/* The lap. Copies, not photographs: hidden from the accessibility tree as a
            whole and given an empty alt inside as well, so a guest using a screen
            reader hears five rooms and not eight.

            aria-hidden is right here and would be wrong on the dock in Atalhos.tsx,
            which says so in its own comment — the difference is that nothing in a
            frame can take focus. The image is a plain <img>: images.unoptimized means
            next/image adds no wrapper and no tabindex of its own. */}
        {quadros.slice(0, volta).map((q) => moldura(q, `volta-${q.id}`, true))}
      </ul>

      {pontos > 1 && (
        // mt-2, not mt-4: the targets below are 44px tall and mostly empty, so the
        // ink sits where mt-4 on a tight row would have put it.
        <div className="mt-2 flex items-center justify-center">
          {Array.from({ length: pontos }, (_, i) => (
            // 2 units of ink in a 48px-tall target — small on the page, still a
            // thumb-sized button. 48 and not 44: every other target on the page is
            // min-h-12, and a dot sitting exactly on the 44px floor measured 43.9998
            // the moment the section above it landed on a fractional pixel row.
            <button
              key={quadros[i].id}
              type="button"
              data-ponto={i}
              aria-current={i === aceso}
              aria-label={`Foto ${i + 1} de ${quadros.length}`}
              onClick={() => irPara(i)}
              className="grid h-12 w-7 place-items-center"
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
