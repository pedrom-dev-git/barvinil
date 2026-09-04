/**
 * WhatsApp deep links.
 *
 * Until UC02 (the real booking form) exists, the "reservar" CTA is step 1 of the
 * ladder that alternativas-de-mercado.md settled on: a wa.me link with the message
 * already written. It works from day one and costs nothing.
 *
 * When the booking form ships, the button changes target — this helper stays, since
 * the panel still has to absorb bookings that arrive by WhatsApp (UC07).
 */

export type MensagemPronta = "reserva" | "duvida";

const MENSAGENS: Record<MensagemPronta, string> = {
  reserva: "Oi! Gostaria de reservar uma mesa no Vinil.",
  duvida: "Oi! Gostaria de tirar uma dúvida.",
};

/**
 * @param e164 digits only, country code included (e.g. "5551994424243")
 */
export function linkWhatsApp(e164: string, mensagem: MensagemPronta): string {
  const numero = e164.replace(/\D/g, "");
  return `https://wa.me/${numero}?text=${encodeURIComponent(MENSAGENS[mensagem])}`;
}

export { MENSAGENS };
