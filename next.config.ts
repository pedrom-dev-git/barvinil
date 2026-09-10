import type { NextConfig } from "next";

/**
 * GitHub Pages serves a project repo from a subdirectory — the landing page lives at
 * /barvinil, not at the root of a domain — so the deploy workflow builds with
 * NEXT_PUBLIC_BASE_PATH set. It stays empty everywhere else: `pnpm dev` and the
 * Playwright suite keep the site at "/", and no existing test has to know about this.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Pages has no Node runtime: the build has to emit plain files into out/.
  output: "export",
  basePath,
  // Pages resolves /rota/ to /rota/index.html. Without this the export writes
  // rota.html and the URL 404s.
  trailingSlash: true,
  // The house has no photos in the repo yet (see ASSETS.md). When they land they
  // are local files under public/fotos/, so no remote patterns are needed.
  images: {
    // next/image's default loader optimises on demand, on a server there is none of
    // here. Without this the export fails the day the first photo arrives.
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
