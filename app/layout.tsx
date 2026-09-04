import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import { site, preenchido } from "@/content/site";
import "./globals.css";

const display = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--fonte-display",
});

const body = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--fonte-body",
});

const nome = preenchido(site.nomeCompleto) ? site.nomeCompleto.valor : "Bar Vinil";
const tagline = preenchido(site.tagline) ? site.tagline.valor : "";
const cidade =
  preenchido(site.endereco) && `${site.endereco.valor.cidade}-${site.endereco.valor.uf}`;

export const metadata: Metadata = {
  title: `${nome}${cidade ? ` · ${cidade}` : ""}`,
  description: tagline,
  openGraph: {
    title: nome,
    description: tagline,
    locale: "pt_BR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0e0b09",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
