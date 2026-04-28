import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["pdf-parse"],
  async rewrites() {
    return [
      {
        source: "/api/markitdown",
        destination: "http://localhost:5000/api/markitdown",
      },
    ];
  },
  // Note: 'output: export' was removed — it conflicts with dynamic API routes.
  // Tauri builds should use a separate build command with NEXT_PUBLIC_TAURI=1
  // to conditionally apply static export settings.
};

export default nextConfig;
