import { Hero } from "@/components/Hero";
import { ACasa } from "@/components/ACasa";
import { Galeria } from "@/components/Galeria";
import { OndeQuando } from "@/components/OndeQuando";
import { Reservar } from "@/components/Reservar";

/**
 * The five sections plano-pmv.md §1 fixed: hero, a casa, fotos, onde/quando, reservar.
 * The scope closed before the work started and freezes at Week 3 — "a landing come o
 * semestre" is a named risk. Adding a sixth section is a scope change, not a tweak.
 */
export default function Home() {
  return (
    <main>
      <Hero />
      <ACasa />
      <Galeria />
      <OndeQuando />
      <Reservar />
    </main>
  );
}
