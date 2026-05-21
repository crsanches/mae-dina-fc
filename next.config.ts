import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["api.sofascore.app"],
  },
  async headers() {
    return [
      {
        source: "/api/team-image",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
    ];
  },
};

export default nextConfig;
