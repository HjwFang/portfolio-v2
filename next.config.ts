import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/experience", destination: "/", permanent: false },
      { source: "/experience/:path*", destination: "/", permanent: false },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "xpulz.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
