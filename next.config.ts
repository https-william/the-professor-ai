import type { NextConfig } from "next";

const isTauri = process.env.NEXT_PUBLIC_TAURI === "1" || process.env.TAURI_ENV_PLATFORM !== undefined;

const nextConfig: NextConfig = {
  output: isTauri ? "export" : undefined,
  images: {
    unoptimized: isTauri ? true : false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
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
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()"
          },
        ],
      },
    ];
  },
  // Note: 'output: export' was removed — it conflicts with dynamic API routes.
  // Tauri builds should use a separate build command with NEXT_PUBLIC_TAURI=1
  // to conditionally apply static export settings.
};

export default nextConfig;
