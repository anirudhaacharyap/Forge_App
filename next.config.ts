import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://forgeapp-production-e708.up.railway.app/api/:path*",
      },
    ];
  },
};

export default nextConfig;
