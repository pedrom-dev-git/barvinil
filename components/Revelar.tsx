"use client";

import { useEffect } from "react";

/**
 * Sections arrive as the page is scrolled, instead of being there all along.
 *
 * It renders nothing and marks the markup from the outside on purpose: the page is
 * a static export, and whatever the server sends has to be a whole page on its own.
 * So nothing is hidden in the HTML. The browser hides what is still below the fold
 * — only once, only if it has an observer to bring it back, and only for a guest
 * who has not asked for less motion. With JavaScript off, or motion refused, this
 * never runs and the page is simply all there.
 */
export function Revelar() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    const secoes = [...document.querySelectorAll<HTMLElement>("main section")];

    const observador = new IntersectionObserver(
      (entradas, obs) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("revelado");
          obs.unobserve(e.target);
        }
      },
      // A section counts as arrived once a sliver of it is up from the bottom edge,
      // so it finishes settling while it is still being scrolled to, not after.
      { rootMargin: "0px 0px -12% 0px" },
    );

    for (const s of secoes) {
      // What is on screen at load was never hidden: there is nothing for it to
      // arrive from, and hiding it first is exactly the flicker to avoid.
      if (s.getBoundingClientRect().top < window.innerHeight) continue;
      s.classList.add("revelar");
      observador.observe(s);
    }

    return () => observador.disconnect();
  }, []);

  return null;
}
