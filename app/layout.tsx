import type { Metadata, Viewport } from "next";
import { Inter, Jost } from "next/font/google";
import { site, preenchido } from "@/content/site";
import "./globals.css";

const display = Jost({
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
  // Most of content/site.ts is still `fonte-publica` — address, phone and menu taken
  // from the bar's own public profiles, none of it confirmed by the owner. Until he
  // signs off, this page must not turn up in search as the house's official site.
  // public/robots.txt says the same thing to crawlers that never read the HTML.
  robots: { index: false, follow: false },
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
