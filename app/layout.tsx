import type { Metadata, Viewport } from "next";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { Dancing_Script } from "next/font/google";
import localFont from "next/font/local";
import { site, preenchido } from "@/content/site";
import { asset } from "@/lib/asset";
import { Rodape } from "@/components/Rodape";
import "./globals.css";

// Brandbook VINIL25 p.24: the brand's running-text face. Self-hosted from the
// files the agency shipped — it is not on any font CDN.
const gorga = localFont({
  src: [
    { path: "./fonts/GorgaGrotesque-Light.otf", weight: "300", style: "normal" },
    { path: "./fonts/GorgaGrotesque-Regular.otf", weight: "400", style: "normal" },
    { path: "./fonts/GorgaGrotesque-Italic.otf", weight: "400", style: "italic" },
    { path: "./fonts/GorgaGrotesque-Bold.otf", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--fonte-gorga",
});

// Brandbook p.25: call-outs only.
const destaque = Dancing_Script({
  subsets: ["latin"],
  display: "swap",
  variable: "--fonte-destaque",
});

// The V icon is the bar's trademark and, like the logo, is not committed: the
// favicon is declared only when the file is there to serve.
const temIcone = existsSync(join(process.cwd(), "public", "icon.png"));

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
  ...(temIcone && { icons: { icon: asset("/icon.png") } }),
  openGraph: {
    title: nome,
    description: tagline,
    locale: "pt_BR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#143325",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${gorga.variable} ${destaque.variable}`}>
      <body>
        {children}
        <Rodape />
      </body>
    </html>
  );
}
