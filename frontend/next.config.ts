import type { NextConfig } from "next";

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  // Proxy /api/* and /webhook to the Express backend (avoids CORS, keeps one port in .env)
  async rewrites() {
    return [
      { source: "/api/:path*",       destination: `${BACKEND}/api/:path*` },
      { source: "/webhook/result",   destination: `${BACKEND}/webhook/result` },
      { source: "/webhook",          destination: `${BACKEND}/webhook` },
      { source: "/health",           destination: `${BACKEND}/health` },
    ];
  },
  // Add explicit proxy configuration
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;

