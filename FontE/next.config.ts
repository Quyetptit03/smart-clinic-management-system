import type { NextConfig } from "next";

const configuredBackend = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5219";
const BACKEND_URL = configuredBackend.endsWith("/api")
  ? configuredBackend
  : `${configuredBackend.replace(/\/$/, "")}/api`;

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Proxy all /api/* requests to the ASP.NET Core backend.
  // This eliminates CORS issues in production and keeps the URL configurable.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
