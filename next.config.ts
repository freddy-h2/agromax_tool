import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: "/api/thumbnail",
        search: "?file=*",
      },
    ],
  },
};

export default nextConfig;
