import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Incluye la base de semilla en las funciones serverless (Vercel)
  outputFileTracingIncludes: {
    "/**": ["./db/seed.db"],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
