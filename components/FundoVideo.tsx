"use client";

import { useEffect, useState } from "react";

/**
 * The house's reel, behind the hero.
 *
 * Client-side because the decision is the visitor's: movement is opt-in here, the
 * same stance as `.gira` in globals.css and as the gallery. For anyone who asked for
 * less motion there is no <video> at all — not a paused one, which would still pull
 * the file down and still paint a first frame.
 */
export function FundoVideo({ src }: { src: string }) {
  // Starts false so the server's HTML and the first client render agree: the reel is
  // something the page gains once it knows the visitor wants it.
  const [podeMover, setPodeMover] = useState(false);

  useEffect(() => {
    const consulta = matchMedia("(prefers-reduced-motion: reduce)");
    const ler = () => setPodeMover(!consulta.matches);
    ler();
    consulta.addEventListener("change", ler);
    return () => consulta.removeEventListener("change", ler);
  }, []);

  if (!podeMover) return null;

  return (
    <video
      src={src}
      autoPlay
      muted
      loop
      playsInline
      // metadata, not auto: the guest arrives from Instagram on mobile data (RNF01),
      // and the hero has to be readable long before the reel has anything to show.
      preload="metadata"
      // Decoration. Everything it says, the page already says in type.
      aria-hidden="true"
      tabIndex={-1}
      className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-30"
    />
  );
}
