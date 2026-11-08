"use client";

import { useEffect, useState } from "react";
import { site, preenchido } from "@/content/site";
import { urlRota } from "@/lib/maps";
import { Botao } from "./Botao";

/**
 * The two doors that leave the page, within reach of a thumb.
 *
 * Everything else here is read top to bottom. These two are errands — order food,
 * get here — and a guest who has decided either one should not have to find the
 * fourth section to act on it. Phone only: on a desktop a pill floating in the
 * corner is where chat widgets live, and the whole page fits in a few scrolls
 * anyway. RNF01 fixes the arrival at a phone, from Instagram.
 *
 * It is named for its job, not its position. The position will change; the job of
 * being the page's shortcuts will not.
 *
 * ## Why it lives in app/layout.tsx and not in app/page.tsx
 *
 * `position: fixed` inside an ancestor that has a `transform` stops being fixed —
 * the transformed ancestor becomes its containing block — and app/globals.css puts
 * a transform on every `main section` through `.revelar`. Out here, as a sibling of
 * <main>, nothing above it transforms. Being outside <main> also keeps it clear of
 * `main section` (components/Revelar.tsx) and `main p` (tests/landing.spec.ts), and
 * out of `section[id]`, which the five frozen sections are asserted against. It is
 * chrome of the viewport, like the footer — not a sixth place on the page.
 *
 * ## When it is on screen
 *
 * Only over `casa`, `fotos` and `onde`. The first screen belongs to "Reservar
 * mesa", the action this project is marked on, and the hero already carries the
 * delivery pill — so there is exactly one red button on screen at any time, the
 * hero's or this one's. And it is gone again before `#reservar` and the footer
 * arrive, which is what keeps a fixed bar off the page's full-width submit buttons.
 */
export function Atalhos() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    // Hero, #reservar and the footer are the places this must not be. The footer is
    // in the list because it carries the "academic prototype" line, and a bar parked
    // over it would cover the one sentence that says what this page is.
    const alvos = ["section#hero", "section#reservar", "footer"]
      .map((sel) => document.querySelector(sel))
      .filter((el): el is Element => el !== null);
    if (alvos.length === 0 || !("IntersectionObserver" in window)) return;

    const naTela = new Set<Element>();
    // #reservar is the one measured by HOW MUCH of it is showing, and that is a
    // measurement rather than a preference. On a phone #onde runs 684px and
    // #reservar starts right under it, so in an 844px viewport the two are on screen
    // together: "present over #onde" and "gone over #reservar" cannot both be true
    // of mere intersection. #onde is the section with the address, which is where
    // "Como chegar" earns its place most, so it keeps the dock — and the dock leaves
    // once the booking is what the guest is actually looking at. The submit button
    // underneath is not protected by this at all: that is the :has() rule in
    // globals.css, which does not depend on scrolling.
    const DOMINA = 0.6;
    const obs = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          const presente =
            e.target.id === "reservar" ? e.intersectionRatio >= DOMINA : e.isIntersecting;
          if (presente) naTela.add(e.target);
          else naTela.delete(e.target);
        }
        setVisivel(naTela.size === 0);
      },
      { threshold: [0, DOMINA] },
    );
    for (const el of alvos) obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const e = preenchido(site.endereco) ? site.endereco.valor : null;
  const temIfood = preenchido(site.ifood);
  if (!e && !temIfood) return null;

  return (
    <>
      {/* Without JavaScript nothing can decide, and the markup is served hidden —
          which would take the delivery storefront away from a visitor whose browser
          simply did not run our effect. This puts it back: whatever the server sends
          has to be a whole page on its own. With JS on, <noscript> is not parsed as
          markup, so this leaks nothing and cannot desync on hydration. Outside any
          @layer on purpose — unlayered rules beat layered utilities. */}
      <noscript>
        <style>{`[data-atalhos]{visibility:visible;opacity:1;transform:none}`}</style>
      </noscript>

      <nav
        data-atalhos
        aria-label="Atalhos"
        // pointer-events-none on the bar and auto on each pill: the bar spans the
        // full width, and without this it would swallow taps meant for whatever sits
        // behind it — the photo rail's dots end up right under here.
        //
        // z-50 because there is no z-index scale in this project: the only other
        // stacked things are the hero's and #reservar's content at z-10. Tailwind 4
        // has no theme namespace for z-index, so this cannot live in @theme.
        //
        // Hidden means `invisible`, never `aria-hidden` (which would fail
        // aria-hidden-focus on a container full of links) and never `inert` (which
        // CSS cannot undo, and the <noscript> rule above needs to). `invisible`
        // already takes it out of the tab order, the a11y tree and the hit test —
        // and it is what FormReserva reads to know whether anything is in its way.
        className={`pointer-events-none fixed inset-x-0 bottom-0 z-50 flex gap-2 border-t border-areia/25 bg-musgo px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-[transform,opacity,visibility] duration-300 ease-suave sm:hidden ${
          visivel ? "visible translate-y-0 opacity-100" : "invisible translate-y-full opacity-0"
        }`}
      >
        {e && (
          <Botao
            href={urlRota(e)}
            externo
            tamanho="compacto"
            className="pointer-events-auto flex-1"
          >
            Como chegar
          </Botao>
        )}
        {temIfood && (
          <Botao
            href={site.ifood.valor!}
            externo
            variante="urucum"
            tamanho="compacto"
            // Wider than its neighbour, and the only filled one: inside the dock the
            // house has no door of its own to compete with, so the borrowed red can
            // lead without taking anything from the booking.
            className="pointer-events-auto flex-[1.25]"
          >
            Pedir no iFood
          </Botao>
        )}
      </nav>
    </>
  );
}
