import type { ReactNode } from "react";

/**
 * Every link on this page is a tap target before it is anything else: min-height
 * 48px, comfortably past the 44px floor the touch specs ask for. That is why there
 * are no inline links inside paragraphs anywhere on the landing.
 */
/**
 * `cheio` is the house's own CTA. `urucum` is the same pill in the delivery red —
 * a third variant rather than a colour prop, so the one place a borrowed brand
 * colour is allowed on this page stays countable.
 */
type Variante = "cheio" | "vazado" | "urucum";

type Props = {
  href: string;
  children: ReactNode;
  variante?: Variante;
  externo?: boolean;
  className?: string;
};

/** Shared with the booking form's <button>s, so they look like every other CTA. */
export function classeBotao(variante: Variante = "vazado"): string {
  const base =
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-7 " +
    "font-display text-sm uppercase tracking-[0.18em] transition-colors duration-200";

  // Same geometry for all three — the pill, the type and the tap target are the
  // design, and the variant only ever changes what fills it.
  const estilo = {
    cheio: "bg-areia text-musgo hover:bg-areia-suave",
    vazado: "border border-areia/55 text-areia hover:border-argila hover:bg-areia/5",
    // Dimmed on hover instead of thinned: an opacity here would let the reel
    // through the fill, and the label's 4,5:1 is measured against solid red. A
    // brightness filter scales ink and fill together, so the ratio survives it.
    urucum: "bg-urucum text-areia hover:brightness-90",
  }[variante];

  return `${base} ${estilo}`;
}

export function Botao({
  href,
  children,
  variante = "vazado",
  externo = false,
  className = "",
}: Props) {
  return (
    <a
      href={href}
      className={`${classeBotao(variante)} ${className}`}
      {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}
