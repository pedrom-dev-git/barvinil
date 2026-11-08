/**
 * Google Maps links, built from the address in content/site.ts.
 *
 * No new field there, on purpose: a URL assembled out of a fact is not a new fact.
 * It has no provenance of its own to track — the `status` and `fonte` that count are
 * the ones on `site.endereco`, where every piece of it came from. A second field
 * holding the same place would be free to drift from the address printed beside it,
 * and nobody would notice until a guest did. Same posture as lib/whatsapp.ts, which
 * assembles wa.me out of the e164 instead of storing the link.
 *
 * The one-line form is NOT ours. It is the exact string the short link the house
 * publishes resolves to — `maps.app.goo.gl/8cBg5ErwpL6ioQSi6` lands on
 * `?q=R.+Cel.+Vicente,+126+-+Centro,+Canoas+-+RS,+92310-430`, separators and all.
 * So this is the query Google has already resolved for this place, not a guess at
 * one: checked 2026-11-08, and cross-checked against OpenStreetMap, which puts the
 * same string on Rua Coronel Vicente, Centro, Canoas-RS, CEP 92310-430. "Cel."
 * resolving to the wrong street was the risk; it does not.
 */

export type EnderecoMapeavel = {
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
};

export const enderecoUmaLinha = (e: EnderecoMapeavel) =>
  `${e.logradouro} - ${e.bairro}, ${e.cidade} - ${e.uf}, ${e.cep}`;

/**
 * Turn-by-turn to the house, in whatever maps app the guest already uses.
 *
 * `/maps/dir/?api=1` is the Maps URLs API: documented, no key, no cost (RNF09). It
 * opens the native app on a phone and the web on a desktop, and leaves the choice
 * of car, bus, foot — or of calling an Uber or a 99 from inside it — to the guest.
 * That is why the dock carries this and not a ride-hailing deep link, which would
 * pick one company on the guest's behalf.
 */
export const urlRota = (e: EnderecoMapeavel) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(enderecoUmaLinha(e))}`;

/**
 * The embeddable map for the #onde square.
 *
 * `output=embed` is the keyless form. It is undocumented, but it is not a back door:
 * it 301s to `/maps/embed?origin=mfe&pb=…`, the same endpoint Google's own
 * "Share → Embed a map" dialog hands out, and embedding a Google map in your own
 * site needs no permission under the Geo Guidelines. Audited 2026-11-08.
 *
 * Why keyless rather than the official Maps Embed API: not cost — that API is free
 * too. It is that a key would have to live in a PUBLIC repository, shared by six
 * people for a semester. The keyless form is the one with no secret in it, which is
 * the right trade here (Regra 13 beats tidiness).
 *
 * ⚠️ What that does buy is fragility: Google can withdraw this form without notice,
 * and no test will catch it — the spec can only assert the shape of the src, so the
 * square would simply be empty. The mitigation is that "Ver no mapa" beside it is a
 * plain link that keeps working either way.
 */
export const urlMapaEmbed = (e: EnderecoMapeavel) =>
  `https://www.google.com/maps?q=${encodeURIComponent(enderecoUmaLinha(e))}&hl=pt-BR&z=17&output=embed`;
