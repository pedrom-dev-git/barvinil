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

/**
 * `compacto` is the same pill with the type scaled down — never a different pill.
 *
 * It exists for the dock, where two labels share one phone-width row: "PEDIR NO
 * IFOOD" at the default `px-7 text-sm tracking-[0.18em]` measures ~147px, and two of
 * those do not fit in 390px. Height, radius and case are untouched, so a compact
 * pill still reads as one of this page's buttons and still clears 48px of thumb.
 *
 * A size here rather than extra classes passed in from outside: overriding `px` and
 * `tracking` through `className` is a cascade fight whose winner depends on the
 * order Tailwind happened to emit, which is the bug the `.gira` comment describes.
 */
type Tamanho = "padrao" | "compacto";

type Props = {
  href: string;
  children: ReactNode;
  variante?: Variante;
  tamanho?: Tamanho;
  externo?: boolean;
  className?: string;
};

/** Shared with the booking form's <button>s, so they look like every other CTA. */
export function classeBotao(variante: Variante = "vazado", tamanho: Tamanho = "padrao"): string {
  const base =
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-full " +
    "font-display uppercase transition-colors duration-200";

  const escala =
    tamanho === "compacto"
      ? "px-4 text-[0.8125rem] tracking-[0.1em]"
      : "px-7 text-sm tracking-[0.18em]";

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

  return `${base} ${escala} ${estilo}`;
}

export function Botao({
  href,
  children,
  variante = "vazado",
  tamanho = "padrao",
  externo = false,
  className = "",
}: Props) {
  return (
    <a
      href={href}
      className={`${classeBotao(variante, tamanho)} ${className}`}
      {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}
