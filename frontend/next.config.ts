import type { NextConfig } from "next";

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

const nextConfig: NextConfig = {
  // Proxy /api/* and /webhook to the Express backend (avoids CORS, keeps one port in .env)
  async rewrites() {
    return [
      { source: "/api/:path*",  destination: `${BACKEND}/api/:path*` },
      { source: "/webhook",     destination: `${BACKEND}/webhook` },
      { source: "/health",      destination: `${BACKEND}/health` },
    ];
  },
};

export default nextConfig;

