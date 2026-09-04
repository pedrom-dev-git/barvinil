import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The house has no photos in the repo yet (see ASSETS.md). When they land they
  // are local files under public/fotos/, so no remote patterns are needed.
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
