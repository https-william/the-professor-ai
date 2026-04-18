import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["pdf-parse"],
  // Note: headers() are ignored in static export mode. 
  // Cache control will be handled by the Tauri asset protocol or the production host.
};

export default nextConfig;
