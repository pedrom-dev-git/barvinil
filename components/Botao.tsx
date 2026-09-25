import type { ReactNode } from "react";

/**
 * Every link on this page is a tap target before it is anything else: min-height
 * 48px, comfortably past the 44px floor the touch specs ask for. That is why there
 * are no inline links inside paragraphs anywhere on the landing.
 */
type Props = {
  href: string;
  children: ReactNode;
  variante?: "cheio" | "vazado";
  externo?: boolean;
  className?: string;
};

/** Shared with the booking form's <button>s, so they look like every other CTA. */
export function classeBotao(variante: "cheio" | "vazado" = "vazado"): string {
  const base =
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-7 " +
    "font-display text-sm uppercase tracking-[0.18em] transition-colors duration-200";

  const estilo =
    variante === "cheio"
      ? "bg-areia text-musgo hover:bg-areia-suave"
      : "border border-areia/35 text-areia hover:border-argila hover:bg-areia/5";

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
