/**
 * WhatsApp deep links.
 *
 * Until UC02 (the real booking system) exists, "Reservar mesa" is step 1 of the
 * ladder that alternativas-de-mercado.md settled on: a small form whose answers
 * become a wa.me message already written. Nothing is stored; the house confirms by
 * hand. It works from day one and costs nothing.
 *
 * When UC02 ships, the button changes target — these helpers stay, since the panel
 * still has to absorb bookings that arrive by WhatsApp (UC07).
 */

export type MensagemPronta = "duvida";

const MENSAGENS: Record<MensagemPronta, string> = {
  duvida: "Oi! Gostaria de tirar uma dúvida.",
};

export type PedidoReserva = {
  /** YYYY-MM-DD, as an <input type="date"> reports it */
  data: string;
  pessoas: number;
  nome: string;
};

const apenasDigitos = (e164: string) => e164.replace(/\D/g, "");

/** The booking as the house reads it in WhatsApp. */
export function mensagemReserva({ data, pessoas, nome }: PedidoReserva): string {
  const [ano, mes, dia] = data.split("-");
  const quantas = `${pessoas} ${pessoas === 1 ? "pessoa" : "pessoas"}`;
  return (
    `Oi! Gostaria de reservar uma mesa no Vinil para ${quantas} ` +
    `no dia ${dia}/${mes}/${ano}, em nome de ${nome.trim()}.`
  );
}

/** @param e164 phone with country code; anything but digits is dropped */
export function linkReserva(e164: string, pedido: PedidoReserva): string {
  return `https://wa.me/${apenasDigitos(e164)}?text=${encodeURIComponent(mensagemReserva(pedido))}`;
}

/**
 * @param e164 digits only, country code included (e.g. "5551994424243")
 */
export function linkWhatsApp(e164: string, mensagem: MensagemPronta): string {
  return `https://wa.me/${apenasDigitos(e164)}?text=${encodeURIComponent(MENSAGENS[mensagem])}`;
}

export { MENSAGENS };
